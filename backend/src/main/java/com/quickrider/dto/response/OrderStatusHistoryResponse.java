package com.quickrider.dto.response;

import com.quickrider.entity.enums.OrderStatus;

import java.time.Instant;

public record OrderStatusHistoryResponse(OrderStatus status, String note, Instant changedAt) {
}
