package com.quickrider.dto.request;

import jakarta.validation.constraints.NotNull;

public record ShopStatusRequest(@NotNull(message = "active is required") Boolean active) {
}
