package com.quickrider.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** OTP login settings - see app.otp in application.yml. A blank masterOtp disables the master code. */
@Validated
@ConfigurationProperties(prefix = "app.otp")
public record OtpProperties(
        String masterOtp,
        @Min(4) @Max(8) int length,
        @Min(1) long expirationMinutes,
        @Min(1) int maxAttempts,
        @Min(0) long resendCooldownSeconds,
        @Min(1) int maxPerHour) {

    public boolean masterOtpEnabled() {
        return masterOtp != null && !masterOtp.isBlank();
    }
}
