package com.quickrider.dto.response;

import java.math.BigDecimal;

/** Result of a real-time stock/price check for one cart line. {@code message} explains any problem. */
public record CartLineResponse(
        Long productId,
        String name,
        String unit,
        int requestedQuantity,
        int availableStock,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        boolean ok,
        String message
) {
}
