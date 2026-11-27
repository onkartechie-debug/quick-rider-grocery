package com.quickrider.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Razorpay payment gateway settings - see app.razorpay in application.yml. */
@Validated
@ConfigurationProperties(prefix = "app.razorpay")
public record RazorpayProperties(
        @NotBlank String keyId,
        @NotBlank String keySecret,
        String webhookSecret,
        @NotBlank String apiBaseUrl,
        @NotBlank String merchantName,
        @Min(1) long pendingPaymentExpiryMinutes,
        @Min(1000) long expiryCheckIntervalMs) {

    public boolean testMode() {
        return keyId.startsWith("rzp_test_");
    }
}
