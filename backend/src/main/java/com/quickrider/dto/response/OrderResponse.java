package com.quickrider.dto.response;

import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.entity.enums.PaymentMethod;
import com.quickrider.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public record OrderResponse(
        Long id,
        String orderNumber,
        OrderStatus status,
        Set<OrderStatus> nextStatuses,
        Long shopId,
        String shopName,
        String shopPhone,
        String deliveryName,
        String deliveryPhone,
        String deliveryAddress,
        String deliveryPincode,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal totalAmount,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String paymentFailureReason,
        Instant paidAt,
        String notes,
        String cancelReason,
        int itemCount,
        List<OrderItemResponse> items,
        List<OrderStatusHistoryResponse> history,
        Instant createdAt,
        Instant updatedAt
) {
}
