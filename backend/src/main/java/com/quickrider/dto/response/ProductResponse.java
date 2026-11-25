package com.quickrider.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        Long shopId,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        String unit,
        BigDecimal price,
        BigDecimal discountedPrice,
        BigDecimal effectivePrice,
        Integer discountPercent,
        int stockQuantity,
        boolean inStock,
        String imageUrl,
        boolean available,
        Instant updatedAt
) {
}
