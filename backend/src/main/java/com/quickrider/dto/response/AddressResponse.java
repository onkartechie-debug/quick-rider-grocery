package com.quickrider.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AddressResponse(
        Long id,
        String label,
        String line1,
        String line2,
        String city,
        String pincode,
        @JsonProperty("isDefault") boolean isDefault,
        String fullText
) {
}
