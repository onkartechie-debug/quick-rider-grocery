package com.quickrider.dto.response;

/**
 * Same response whether or not the number is registered, so the endpoint can't be used to discover
 * which numbers have accounts.
 */
public record OtpRequestResponse(String message, long expiresInSeconds, long resendAfterSeconds) {
}
