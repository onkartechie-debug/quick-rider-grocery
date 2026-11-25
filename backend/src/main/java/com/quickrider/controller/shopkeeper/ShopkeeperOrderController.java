package com.quickrider.controller.shopkeeper;

import com.quickrider.dto.request.OrderStatusUpdateRequest;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.OrderService;
import com.quickrider.util.PageUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shopkeeper/orders")
@PreAuthorize("hasRole('SHOPKEEPER')")
@RequiredArgsConstructor
public class ShopkeeperOrderController {

    private final OrderService orderService;

    /** {@code status} may be repeated, e.g. {@code ?status=PLACED&status=ACCEPTED}. Omit for all orders. */
    @GetMapping
    public PageResponse<OrderResponse> list(@CurrentUser UserPrincipal user,
                                            @RequestParam(name = "status", required = false) List<OrderStatus> statuses,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return orderService.shopOrders(user.getId(), statuses,
                PageUtils.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@CurrentUser UserPrincipal user, @PathVariable Long orderId) {
        return orderService.shopOrder(user.getId(), orderId);
    }

    @PatchMapping("/{orderId}/status")
    public OrderResponse updateStatus(@CurrentUser UserPrincipal user, @PathVariable Long orderId,
                                      @Valid @RequestBody OrderStatusUpdateRequest request) {
        return orderService.updateStatus(user.getId(), orderId, request);
    }
}
