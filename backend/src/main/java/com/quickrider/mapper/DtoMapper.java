package com.quickrider.mapper;

import com.quickrider.dto.response.AddressResponse;
import com.quickrider.dto.response.CategoryResponse;
import com.quickrider.dto.response.OrderItemResponse;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.OrderStatusHistoryResponse;
import com.quickrider.dto.response.OwnerSummary;
import com.quickrider.dto.response.ProductResponse;
import com.quickrider.dto.response.ShopResponse;
import com.quickrider.entity.Address;
import com.quickrider.entity.Category;
import com.quickrider.entity.Order;
import com.quickrider.entity.OrderItem;
import com.quickrider.entity.OrderStatusHistory;
import com.quickrider.entity.Product;
import com.quickrider.entity.Shop;
import com.quickrider.entity.User;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/** Entity to DTO conversion. Must be called inside a transaction (open-in-view is disabled). */
public final class DtoMapper {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private DtoMapper() {
    }

    public static OwnerSummary toOwner(User user) {
        return new OwnerSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.isEnabled());
    }

    public static ShopResponse toShop(Shop shop, boolean openNow, boolean includeOwner) {
        return new ShopResponse(
                shop.getId(),
                shop.getName(),
                shop.getDescription(),
                shop.getAddress(),
                shop.getCity(),
                shop.getPincode(),
                shop.getPhone(),
                shop.getDeliveryRadiusKm(),
                shop.getOpeningTime(),
                shop.getClosingTime(),
                shop.getImageUrl(),
                shop.getMinOrderAmount(),
                shop.getDeliveryFee(),
                shop.getRating(),
                shop.isActive(),
                shop.isActive() && openNow,
                includeOwner ? toOwner(shop.getOwner()) : null,
                shop.getCreatedAt());
    }

    public static CategoryResponse toCategory(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(), category.getIcon());
    }

    public static ProductResponse toProduct(Product p) {
        Integer discountPercent = null;
        if (p.getDiscountedPrice() != null && p.getDiscountedPrice().compareTo(p.getPrice()) < 0) {
            discountPercent = p.getPrice().subtract(p.getDiscountedPrice())
                    .multiply(HUNDRED)
                    .divide(p.getPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
        }
        return new ProductResponse(
                p.getId(),
                p.getShop().getId(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.getName(),
                p.getDescription(),
                p.getUnit(),
                p.getPrice(),
                p.getDiscountedPrice(),
                p.effectivePrice(),
                discountPercent,
                p.getStockQuantity(),
                p.isPurchasable(),
                p.getImageUrl(),
                p.isAvailable(),
                p.getUpdatedAt());
    }

    public static OrderResponse toOrder(Order o) {
        List<OrderItemResponse> items = o.getItems().stream().map(DtoMapper::toOrderItem).toList();
        List<OrderStatusHistoryResponse> history = o.getStatusHistory().stream().map(DtoMapper::toHistory).toList();
        int itemCount = o.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
        Shop shop = o.getShop();
        return new OrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getStatus(),
                o.getStatus().nextStatuses(),
                shop.getId(),
                shop.getName(),
                shop.getPhone(),
                o.getDeliveryName(),
                o.getDeliveryPhone(),
                o.getDeliveryAddress(),
                o.getDeliveryPincode(),
                o.getSubtotal(),
                o.getDeliveryFee(),
                o.getTotalAmount(),
                o.getPaymentMethod(),
                o.getNotes(),
                o.getCancelReason(),
                itemCount,
                items,
                history,
                o.getCreatedAt(),
                o.getUpdatedAt());
    }

    public static AddressResponse toAddress(Address a) {
        return new AddressResponse(a.getId(), a.getLabel(), a.getLine1(), a.getLine2(), a.getCity(),
                a.getPincode(), a.isDefaultAddress(), a.fullText());
    }

    private static OrderItemResponse toOrderItem(OrderItem item) {
        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;
        return new OrderItemResponse(item.getId(), productId, item.getProductName(), item.getUnit(),
                item.getUnitPrice(), item.getQuantity(), item.getLineTotal());
    }

    private static OrderStatusHistoryResponse toHistory(OrderStatusHistory h) {
        return new OrderStatusHistoryResponse(h.getStatus(), h.getNote(), h.getChangedAt());
    }
}
