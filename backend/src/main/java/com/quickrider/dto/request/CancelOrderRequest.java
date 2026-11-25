package com.quickrider.dto.request;

import jakarta.validation.constraints.Size;

public record CancelOrderRequest(@Size(max = 300) String reason) {
}
