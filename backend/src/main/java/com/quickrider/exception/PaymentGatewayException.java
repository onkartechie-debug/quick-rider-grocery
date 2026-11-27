package com.quickrider.exception;

/** 502 - the payment gateway (Razorpay) could not be reached or rejected the call. */
public class PaymentGatewayException extends RuntimeException {

    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
