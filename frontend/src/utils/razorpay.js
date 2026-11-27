// Razorpay Checkout.js integration (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
// Loaded on demand from Razorpay's CDN - it is not an npm package.

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load the payment gateway. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return loading;
}

/**
 * Opens Checkout for a backend-issued checkout (POST /customer/orders/{id}/payment) and resolves once:
 *   { status: 'success', response }  - razorpay_order_id / razorpay_payment_id / razorpay_signature
 *   { status: 'dismissed', lastError } - the customer closed Checkout (possibly after failed attempts)
 * A failed attempt does NOT resolve: Checkout stays open so the customer can retry; `onAttemptFailed`
 * is called for each one so it can be recorded.
 */
export function openRazorpayCheckout(checkout, { method, themeColor = '#059669', onAttemptFailed } = {}) {
  return new Promise((resolve) => {
    let lastError = null;
    const rzp = new window.Razorpay({
      key: checkout.keyId,
      order_id: checkout.razorpayOrderId,
      amount: checkout.amount, // paise
      currency: checkout.currency,
      name: checkout.merchantName,
      description: checkout.description,
      prefill: {
        name: checkout.customerName,
        email: checkout.customerEmail,
        contact: checkout.customerPhone,
        ...(method ? { method } : {}),
      },
      notes: { orderNumber: checkout.orderNumber },
      theme: { color: themeColor },
      retry: { enabled: true },
      handler: (response) => resolve({ status: 'success', response }),
      modal: {
        confirm_close: true,
        ondismiss: () => resolve({ status: 'dismissed', lastError }),
      },
    });
    rzp.on('payment.failed', ({ error }) => {
      lastError = error;
      onAttemptFailed?.(error);
    });
    rzp.open();
  });
}

/** Razorpay Checkout's preferred method for our payment method enum. */
export function checkoutMethodFor(paymentMethod) {
  return paymentMethod === 'UPI' ? 'upi' : paymentMethod === 'CARD' ? 'card' : undefined;
}

export const RAZORPAY_TEST_HINT =
  'Test mode: no real money is charged. Use UPI ID success@razorpay, or card 4111 1111 1111 1111 with any future expiry and any CVV (OTP: any 4+ digits).';
