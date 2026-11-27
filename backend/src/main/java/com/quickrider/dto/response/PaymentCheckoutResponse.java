package com.quickrider.dto.response;

import java.time.Instant;

/** Everything the browser needs to open Razorpay Checkout for an order. Never contains secrets. */
public record PaymentCheckoutResponse(
        Long orderId,
        String orderNumber,
        String keyId,
        String razorpayOrderId,
        /** In paise - Razorpay Checkout's unit. */
        long amount,
        String currency,
        String merchantName,
        String description,
        String customerName,
        String customerEmail,
        String customerPhone,
        boolean testMode,
        /** The order is cancelled automatically if still unpaid at this time. */
        Instant payBefore) {
}
