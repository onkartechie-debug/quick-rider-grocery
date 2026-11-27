package com.quickrider.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Sent from Razorpay Checkout's {@code payment.failed} handler, or {@code modal.ondismiss} when the
 * customer closes checkout (then only razorpayOrderId/errorDescription are present).
 */
public record PaymentFailureRequest(
        @NotBlank @Size(max = 40) String razorpayOrderId,
        @Size(max = 40) String razorpayPaymentId,
        @Size(max = 60) String errorCode,
        @Size(max = 500) String errorDescription) {
}
