package com.quickrider.service;

import com.quickrider.dto.request.PaymentFailureRequest;
import com.quickrider.dto.request.VerifyPaymentRequest;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PaymentCheckoutResponse;

/**
 * Razorpay online payments for UPI/CARD orders. Payment is confirmed by whichever arrives first:
 * the client's signed Checkout callback ({@link #verify}), the server-to-server webhook
 * ({@link #handleWebhook}), or reconciliation by the expiry job ({@link #expireIfUnpaid}).
 */
public interface PaymentService {

    /** Creates (or reuses) the Razorpay order for an AWAITING_PAYMENT order and returns Checkout options. */
    PaymentCheckoutResponse startCheckout(Long customerId, Long orderId);

    OrderResponse verify(Long customerId, Long orderId, VerifyPaymentRequest request);

    OrderResponse recordFailure(Long customerId, Long orderId, PaymentFailureRequest request);

    /** @return false when the signature is invalid (caller answers 400). */
    boolean handleWebhook(String rawBody, String signature);

    /** Cancels the order (restoring stock) if still unpaid - after first asking Razorpay whether it was paid. */
    void expireIfUnpaid(Long orderId);
}
