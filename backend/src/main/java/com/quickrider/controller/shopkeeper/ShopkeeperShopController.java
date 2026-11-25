package com.quickrider.controller.shopkeeper;

import com.quickrider.dto.response.ShopResponse;
import com.quickrider.dto.response.ShopkeeperDashboardResponse;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.MetricsService;
import com.quickrider.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shopkeeper")
@PreAuthorize("hasRole('SHOPKEEPER')")
@RequiredArgsConstructor
public class ShopkeeperShopController {

    private final ShopService shopService;
    private final MetricsService metricsService;

    @GetMapping("/shop")
    public ShopResponse myShop(@CurrentUser UserPrincipal user) {
        return shopService.myShop(user.getId());
    }

    @GetMapping("/dashboard")
    public ShopkeeperDashboardResponse dashboard(@CurrentUser UserPrincipal user) {
        return metricsService.shopkeeperDashboard(user.getId());
    }
}
