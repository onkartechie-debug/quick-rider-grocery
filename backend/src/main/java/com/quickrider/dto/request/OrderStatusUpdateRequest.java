package com.quickrider.dto.request;

import com.quickrider.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** {@code note} is required when moving an order to CANCELLED (used as the cancel reason). */
public record OrderStatusUpdateRequest(
        @NotNull(message = "Status is required")
        OrderStatus status,

        @Size(max = 300)
        String note
) {
}
