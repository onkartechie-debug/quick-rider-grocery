package com.quickrider.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @Size(max = 40)
        String label,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 200)
        String line1,

        @Size(max = 200)
        String line2,

        @NotBlank(message = "City is required")
        @Size(max = 80)
        String city,

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
        String pincode,

        Boolean isDefault
) {
}
