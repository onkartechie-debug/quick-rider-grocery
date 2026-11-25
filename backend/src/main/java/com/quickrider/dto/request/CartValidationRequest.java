package com.quickrider.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CartValidationRequest(
        @NotNull(message = "shopId is required")
        Long shopId,

        @NotEmpty(message = "Cart is empty")
        @Size(max = 50, message = "A cart can hold at most 50 different items")
        List<@Valid @NotNull CartItemRequest> items
) {
}
