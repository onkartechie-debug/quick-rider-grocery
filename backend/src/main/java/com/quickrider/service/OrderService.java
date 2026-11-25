package com.quickrider.service;

import com.quickrider.dto.request.CartValidationRequest;
import com.quickrider.dto.request.OrderStatusUpdateRequest;
import com.quickrider.dto.request.PlaceOrderRequest;
import com.quickrider.dto.response.CartValidationResponse;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.entity.enums.OrderStatus;
import org.springframework.data.domain.Pageable;

import java.util.Collection;

public interface OrderService {

    // ----- Customer -----
    CartValidationResponse validateCart(CartValidationRequest request);

    OrderResponse placeOrder(Long customerId, PlaceOrderRequest request);

    PageResponse<OrderResponse> customerOrders(Long customerId, Pageable pageable);

    OrderResponse customerOrder(Long customerId, Long orderId);

    OrderResponse cancelByCustomer(Long customerId, Long orderId, String reason);

    // ----- Shopkeeper -----
    PageResponse<OrderResponse> shopOrders(Long ownerId, Collection<OrderStatus> statuses, Pageable pageable);

    OrderResponse shopOrder(Long ownerId, Long orderId);

    OrderResponse updateStatus(Long ownerId, Long orderId, OrderStatusUpdateRequest request);
}
