package com.quickrider.exception;

/** 400 - business-rule violation (insufficient stock, invalid status transition, shop closed, etc.). */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
