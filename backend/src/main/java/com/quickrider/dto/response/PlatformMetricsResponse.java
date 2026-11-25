package com.quickrider.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record PlatformMetricsResponse(
        long totalShops,
        long activeShops,
        long totalOrders,
        long ordersToday,
        BigDecimal deliveredRevenue,
        long totalCustomers,
        long totalShopkeepers,
        long activeUsers,
        Map<String, Long> ordersByStatus
) {
}
