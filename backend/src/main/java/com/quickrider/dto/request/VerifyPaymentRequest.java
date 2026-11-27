package com.quickrider.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Sent from Razorpay Checkout's success handler (razorpay_order_id / razorpay_payment_id / razorpay_signature). */
public record VerifyPaymentRequest(
        @NotBlank @Size(max = 40) String razorpayOrderId,
        @NotBlank @Size(max = 40) String razorpayPaymentId,
        @NotBlank @Size(max = 128) String razorpaySignature) {
}
