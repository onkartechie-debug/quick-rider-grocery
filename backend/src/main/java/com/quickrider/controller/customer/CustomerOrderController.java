package com.quickrider.controller.customer;

import com.quickrider.dto.request.CancelOrderRequest;
import com.quickrider.dto.request.CartValidationRequest;
import com.quickrider.dto.request.PlaceOrderRequest;
import com.quickrider.dto.response.CartValidationResponse;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.OrderService;
import com.quickrider.util.PageUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerOrderController {

    private final OrderService orderService;

    /** Real-time stock, price, opening-hours and minimum-order check, called before checkout. */
    @PostMapping("/cart/validate")
    public CartValidationResponse validateCart(@Valid @RequestBody CartValidationRequest request) {
        return orderService.validateCart(request);
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@CurrentUser UserPrincipal user,
                                                    @Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(user.getId(), request));
    }

    @GetMapping("/orders")
    public PageResponse<OrderResponse> myOrders(@CurrentUser UserPrincipal user,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return orderService.customerOrders(user.getId(),
                PageUtils.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    /** Polled by the order-tracking screen for live status updates. */
    @GetMapping("/orders/{orderId}")
    public OrderResponse myOrder(@CurrentUser UserPrincipal user, @PathVariable Long orderId) {
        return orderService.customerOrder(user.getId(), orderId);
    }

    @PostMapping("/orders/{orderId}/cancel")
    public OrderResponse cancel(@CurrentUser UserPrincipal user, @PathVariable Long orderId,
                                @Valid @RequestBody(required = false) CancelOrderRequest request) {
        return orderService.cancelByCustomer(user.getId(), orderId, request != null ? request.reason() : null);
    }
}
