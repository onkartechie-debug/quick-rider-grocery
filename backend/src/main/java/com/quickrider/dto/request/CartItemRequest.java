package com.quickrider.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemRequest(
        @NotNull(message = "productId is required")
        Long productId,

        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 50, message = "Maximum 50 units per item")
        Integer quantity
) {
}
