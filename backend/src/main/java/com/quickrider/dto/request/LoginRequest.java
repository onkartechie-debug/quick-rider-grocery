package com.quickrider.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        @Size(max = 160)
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = 100)
        String password
) {
}
