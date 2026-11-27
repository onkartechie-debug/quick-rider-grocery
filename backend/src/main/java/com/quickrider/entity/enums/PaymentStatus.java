package com.quickrider.entity.enums;

/**
 * PENDING: not paid yet (COD until delivery, or an online payment not yet confirmed).
 * PAID: settled - online payment verified, or COD collected on delivery.
 * FAILED: last online attempt failed; the customer can retry while the order is AWAITING_PAYMENT.
 * REFUND_PENDING: an online-paid order was cancelled; refund it from the Razorpay dashboard.
 */
public enum PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    REFUND_PENDING
}
