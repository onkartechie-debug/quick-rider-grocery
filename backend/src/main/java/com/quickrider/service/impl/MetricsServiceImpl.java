package com.quickrider.service.impl;

import com.quickrider.dto.response.PlatformMetricsResponse;
import com.quickrider.dto.response.ShopkeeperDashboardResponse;
import com.quickrider.entity.Shop;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.entity.enums.Role;
import com.quickrider.repository.OrderRepository;
import com.quickrider.repository.ProductRepository;
import com.quickrider.repository.ShopRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.service.MetricsService;
import com.quickrider.service.ShopService;
import com.quickrider.util.BusinessClock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MetricsServiceImpl implements MetricsService {

    private static final EnumSet<OrderStatus> ACTIVE_STATUSES = EnumSet.of(
            OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PACKING, OrderStatus.OUT_FOR_DELIVERY);

    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ShopService shopService;
    private final BusinessClock clock;
    private final int lowStockThreshold;

    public MetricsServiceImpl(ShopRepository shopRepository,
                              OrderRepository orderRepository,
                              UserRepository userRepository,
                              ProductRepository productRepository,
                              ShopService shopService,
                              BusinessClock clock,
                              @Value("${app.business.low-stock-threshold:10}") int lowStockThreshold) {
        this.shopRepository = shopRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.shopService = shopService;
        this.clock = clock;
        this.lowStockThreshold = lowStockThreshold;
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformMetricsResponse platformMetrics() {
        return new PlatformMetricsResponse(
                shopRepository.count(),
                shopRepository.countByActiveTrue(),
                orderRepository.count(),
                orderRepository.countByCreatedAtGreaterThanEqual(clock.startOfToday()),
                orderRepository.sumTotalByStatus(OrderStatus.DELIVERED),
                userRepository.countByRole(Role.CUSTOMER),
                userRepository.countByRole(Role.SHOPKEEPER),
                userRepository.countByEnabledTrue(),
                toStatusMap(orderRepository.countGroupedByStatus()));
    }

    @Override
    @Transactional(readOnly = true)
    public ShopkeeperDashboardResponse shopkeeperDashboard(Long ownerId) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        Long shopId = shop.getId();
        Instant today = clock.startOfToday();
        return new ShopkeeperDashboardResponse(
                shopId,
                shop.getName(),
                shop.isActive(),
                shop.isActive() && clock.isOpenNow(shop),
                productRepository.countByShopId(shopId),
                productRepository.countByShopIdAndStockQuantityLessThan(shopId, lowStockThreshold),
                orderRepository.countByShopIdAndCreatedAtGreaterThanEqual(shopId, today),
                orderRepository.sumShopRevenueSince(shopId, today),
                orderRepository.countByShopIdAndStatusIn(shopId, ACTIVE_STATUSES),
                toStatusMap(orderRepository.countGroupedByStatusForShop(shopId)));
    }

    /** Always returns every status (zero-filled) in pipeline order so the UI can render a stable chart. */
    private static Map<String, Long> toStatusMap(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            result.put(status.name(), 0L);
        }
        for (Object[] row : rows) {
            result.put(((OrderStatus) row[0]).name(), ((Number) row[1]).longValue());
        }
        return result;
    }
}
