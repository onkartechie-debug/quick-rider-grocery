package com.quickrider.exception;

/** 409 - the request conflicts with current state (duplicate email, cart from another shop, etc.). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
