package com.quickrider.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String unit,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
) {
}
