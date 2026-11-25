package com.quickrider.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartValidationResponse(
        Long shopId,
        String shopName,
        boolean shopOpen,
        boolean valid,
        List<CartLineResponse> lines,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal total,
        BigDecimal minOrderAmount,
        List<String> messages
) {
}
