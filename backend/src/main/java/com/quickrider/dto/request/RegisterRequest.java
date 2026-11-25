package com.quickrider.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Public self-registration always creates a CUSTOMER. Shopkeepers are created by an admin. */
public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120, message = "Name must be 2-120 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        @Size(max = 160)
        String email,

        @Pattern(regexp = "^$|^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain a letter and a number")
        String password
) {
}
