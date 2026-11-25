package com.quickrider.service;

import com.quickrider.dto.response.PlatformMetricsResponse;
import com.quickrider.dto.response.ShopkeeperDashboardResponse;

public interface MetricsService {

    PlatformMetricsResponse platformMetrics();

    ShopkeeperDashboardResponse shopkeeperDashboard(Long ownerId);
}
