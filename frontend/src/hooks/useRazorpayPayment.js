import { useCallback, useState } from 'react';
import { customerApi } from '../api/customerApi.js';
import { errorMessage } from '../api/axiosClient.js';
import { checkoutMethodFor, loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay.js';

/**
 * Full online-payment flow for an AWAITING_PAYMENT order:
 * start checkout (backend creates/reuses the Razorpay order) -> Checkout.js -> verify signature on the backend.
 * Resolves to { outcome: 'paid' | 'not_paid' | 'error', order?, message? } - never throws.
 * The backend webhook / reconciliation independently confirms payments, so 'not_paid' is not final.
 */
export default function useRazorpayPayment() {
  const [paying, setPaying] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const pay = useCallback(async (orderId, paymentMethod) => {
    setPaying(true);
    try {
      const { data: checkout } = await customerApi.startPayment(orderId);
      setTestMode(checkout.testMode);
      await loadRazorpayScript();

      const result = await openRazorpayCheckout(checkout, {
        method: checkoutMethodFor(paymentMethod),
        onAttemptFailed: (error) => {
          customerApi
            .paymentFailed(orderId, {
              razorpayOrderId: checkout.razorpayOrderId,
              razorpayPaymentId: error?.metadata?.payment_id || null,
              errorCode: error?.code || null,
              errorDescription: [error?.description, error?.reason].filter(Boolean).join(' - ') || null,
            })
            .catch(() => {});
        },
      });

      if (result.status === 'dismissed') {
        const { data: order } = await customerApi
          .paymentFailed(orderId, {
            razorpayOrderId: checkout.razorpayOrderId,
            errorDescription: result.lastError?.description || 'Checkout closed before payment',
          })
          .catch(() => customerApi.order(orderId));
        // A webhook may have confirmed it in the meantime.
        if (order?.paymentStatus === 'PAID') return { outcome: 'paid', order };
        return {
          outcome: 'not_paid',
          order,
          message: result.lastError?.description || 'Payment was not completed.',
        };
      }

      try {
        const { data: order } = await customerApi.verifyPayment(orderId, {
          razorpayOrderId: result.response.razorpay_order_id,
          razorpayPaymentId: result.response.razorpay_payment_id,
          razorpaySignature: result.response.razorpay_signature,
        });
        return { outcome: 'paid', order };
      } catch (err) {
        // Verify can lose a race with the webhook - re-read before reporting a problem.
        const { data: order } = await customerApi.order(orderId);
        if (order.paymentStatus === 'PAID') return { outcome: 'paid', order };
        return { outcome: 'error', order, message: errorMessage(err, 'Payment could not be verified') };
      }
    } catch (err) {
      return { outcome: 'error', message: errorMessage(err, err?.message || 'Could not start the payment') };
    } finally {
      setPaying(false);
    }
  }, []);

  return { pay, paying, testMode };
}
