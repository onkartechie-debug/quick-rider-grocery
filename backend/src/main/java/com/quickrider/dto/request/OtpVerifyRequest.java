package com.quickrider.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
        String phone,

        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "^[0-9]{4,8}$", message = "Enter the OTP sent to your phone")
        String otp) {
}
