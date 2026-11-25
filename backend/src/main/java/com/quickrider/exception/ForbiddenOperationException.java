package com.quickrider.exception;

/** 403 - authenticated, but the resource belongs to someone else (e.g. another shop's product). */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
