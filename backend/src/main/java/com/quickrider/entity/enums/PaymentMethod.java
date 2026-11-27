package com.quickrider.entity.enums;

public enum PaymentMethod {
    /** Cash on delivery. */
    COD,
    /** Paid online through Razorpay Checkout (UPI). */
    UPI,
    /** Paid online through Razorpay Checkout (card / netbanking / wallet). */
    CARD;

    /** True when the order must be paid through the payment gateway before the shop sees it. */
    public boolean isOnline() {
        return this != COD;
    }
}
