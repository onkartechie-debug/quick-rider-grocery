package com.quickrider.dto.request;

import com.quickrider.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlaceOrderRequest(
        @NotNull(message = "shopId is required")
        Long shopId,

        @NotNull(message = "Select a delivery address")
        Long addressId,

        @NotEmpty(message = "Cart is empty")
        @Size(max = 50, message = "A cart can hold at most 50 different items")
        List<@Valid @NotNull CartItemRequest> items,

        @NotNull(message = "Select a payment method")
        PaymentMethod paymentMethod,

        @Pattern(regexp = "^$|^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
        String contactPhone,

        @Size(max = 300)
        String notes
) {
}
