package com.quickrider.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record ShopkeeperDashboardResponse(
        Long shopId,
        String shopName,
        boolean shopActive,
        boolean openNow,
        long totalProducts,
        long lowStockProducts,
        long ordersToday,
        BigDecimal revenueToday,
        long activeOrders,
        Map<String, Long> ordersByStatus
) {
}
