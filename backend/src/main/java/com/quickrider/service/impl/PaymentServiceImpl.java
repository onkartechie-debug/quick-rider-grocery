package com.quickrider.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickrider.config.RazorpayProperties;
import com.quickrider.dto.request.PaymentFailureRequest;
import com.quickrider.dto.request.VerifyPaymentRequest;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PaymentCheckoutResponse;
import com.quickrider.entity.Order;
import com.quickrider.entity.User;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.entity.enums.PaymentStatus;
import com.quickrider.event.OrderEvent;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.PaymentGatewayException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.integration.razorpay.RazorpayClient;
import com.quickrider.integration.razorpay.RazorpayClient.RazorpayOrder;
import com.quickrider.integration.razorpay.RazorpaySignatures;
import com.quickrider.mapper.DtoMapper;
import com.quickrider.repository.OrderRepository;
import com.quickrider.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final RazorpayClient razorpayClient;
    private final RazorpayProperties properties;
    private final ApplicationEventPublisher events;
    private final ObjectMapper objectMapper;

    // =====================================================================
    // Customer (Checkout)
    // =====================================================================

    @Override
    @Transactional
    public PaymentCheckoutResponse startCheckout(Long customerId, Long orderId) {
        Order order = lockCustomerOrder(customerId, orderId);
        if (!order.getPaymentMethod().isOnline()) {
            throw new BadRequestException("This order is cash on delivery - no online payment needed");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("This order is already paid");
        }
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new BadRequestException("This order can no longer be paid");
        }
        Instant payBefore = order.getCreatedAt().plus(Duration.ofMinutes(properties.pendingPaymentExpiryMinutes()));
        if (Instant.now().isAfter(payBefore)) {
            throw new BadRequestException("The time to pay for this order has run out. Please place a new order.");
        }

        long amountPaise = toPaise(order.getTotalAmount());
        // One Razorpay order per QuickRider order: Razorpay allows many payment attempts on it, and a late
        // webhook for an earlier attempt still matches this order.
        if (order.getRazorpayOrderId() == null) {
            Map<String, String> notes = new LinkedHashMap<>();
            notes.put("orderId", String.valueOf(order.getId()));
            notes.put("orderNumber", order.getOrderNumber());
            notes.put("shop", order.getShop().getName());
            RazorpayOrder created = razorpayClient.createOrder(amountPaise, order.getOrderNumber(), notes);
            order.setRazorpayOrderId(created.id());
            log.info("Created Razorpay order {} for order {} ({} paise)", created.id(), order.getOrderNumber(), amountPaise);
        }

        User customer = order.getCustomer();
        return new PaymentCheckoutResponse(
                order.getId(),
                order.getOrderNumber(),
                razorpayClient.keyId(),
                order.getRazorpayOrderId(),
                amountPaise,
                "INR",
                properties.merchantName(),
                "Order " + order.getOrderNumber() + " - " + order.getShop().getName(),
                customer.getFullName(),
                customer.getEmail(),
                order.getDeliveryPhone(),
                properties.testMode(),
                payBefore);
    }

    @Override
    @Transactional
    public OrderResponse verify(Long customerId, Long orderId, VerifyPaymentRequest request) {
        Order order = lockCustomerOrder(customerId, orderId);
        requireSameRazorpayOrder(order, request.razorpayOrderId());
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return DtoMapper.toOrder(order); // webhook got here first
        }
        if (!RazorpaySignatures.isValidPayment(request.razorpayOrderId(), request.razorpayPaymentId(),
                request.razorpaySignature(), properties.keySecret())) {
            log.warn("Invalid Razorpay signature for order {} (razorpay order {})", order.getOrderNumber(),
                    request.razorpayOrderId());
            throw new BadRequestException("Payment could not be verified. If money was deducted it will be "
                    + "confirmed automatically within a few minutes.");
        }
        markPaid(order, request.razorpayPaymentId(), "Payment received online");
        return DtoMapper.toOrder(order);
    }

    @Override
    @Transactional
    public OrderResponse recordFailure(Long customerId, Long orderId, PaymentFailureRequest request) {
        Order order = lockCustomerOrder(customerId, orderId);
        requireSameRazorpayOrder(order, request.razorpayOrderId());
        applyFailure(order, request.razorpayPaymentId(), request.errorCode(), request.errorDescription());
        return DtoMapper.toOrder(order);
    }

    // =====================================================================
    // Webhook (server-to-server)
    // =====================================================================

    @Override
    @Transactional
    public boolean handleWebhook(String rawBody, String signature) {
        if (!RazorpaySignatures.isValidWebhook(rawBody, signature, properties.webhookSecret())) {
            log.warn("Rejected Razorpay webhook with invalid signature");
            return false;
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(rawBody);
        } catch (Exception ex) {
            log.warn("Rejected unparseable Razorpay webhook: {}", ex.getMessage());
            return false;
        }
        String event = root.path("event").asText();
        JsonNode payment = root.path("payload").path("payment").path("entity");
        String razorpayOrderId = payment.path("order_id").asText(null);
        if (razorpayOrderId == null) {
            razorpayOrderId = root.path("payload").path("order").path("entity").path("id").asText(null);
        }
        if (razorpayOrderId == null) {
            log.debug("Ignoring Razorpay webhook {} without an order id", event);
            return true;
        }

        Optional<Order> found = orderRepository.lockByRazorpayOrderId(razorpayOrderId);
        if (found.isEmpty()) {
            // Not ours (e.g. another app sharing the test account) - acknowledge so Razorpay stops retrying.
            log.info("Ignoring Razorpay webhook {} for unknown order {}", event, razorpayOrderId);
            return true;
        }
        Order order = found.get();
        String paymentId = payment.path("id").asText(null);

        switch (event) {
            case "payment.captured", "order.paid" -> {
                long paid = payment.path("amount").asLong(-1);
                if (paid >= 0 && paid != toPaise(order.getTotalAmount())) {
                    log.error("Razorpay webhook {} for order {}: amount {} paise does not match order total {} - not "
                            + "marking paid", event, order.getOrderNumber(), paid, order.getTotalAmount());
                    return true;
                }
                markPaid(order, paymentId, "Payment confirmed by Razorpay");
            }
            case "payment.failed" -> applyFailure(order, paymentId, payment.path("error_code").asText(null),
                    payment.path("error_description").asText(null));
            default -> log.debug("Ignoring Razorpay webhook event {} for order {}", event, order.getOrderNumber());
        }
        return true;
    }

    // =====================================================================
    // Expiry / reconciliation
    // =====================================================================

    @Override
    @Transactional
    public void expireIfUnpaid(Long orderId) {
        Order order = orderRepository.lockById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            return;
        }
        if (order.getRazorpayOrderId() != null) {
            // Never cancel an order the customer actually paid for (webhook lost / browser closed).
            try {
                RazorpayOrder remote = razorpayClient.fetchOrder(order.getRazorpayOrderId());
                if (remote != null && remote.isPaid()) {
                    String paymentId = razorpayClient.findCapturedPaymentId(order.getRazorpayOrderId()).orElse(null);
                    markPaid(order, paymentId, "Payment confirmed on reconciliation");
                    return;
                }
            } catch (PaymentGatewayException ex) {
                log.warn("Skipping expiry of order {} - could not reach Razorpay: {}", order.getOrderNumber(),
                        ex.getMessage());
                return;
            }
        }
        String reason = "Payment not completed within " + properties.pendingPaymentExpiryMinutes() + " minutes";
        OrderServiceImpl.cancel(order, null, reason);
        events.publishEvent(OrderEvent.statusChanged(order.getId(), OrderStatus.CANCELLED));
        log.info("Expired unpaid order {}", order.getOrderNumber());
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    /** Success path shared by client verify, webhook and reconciliation. Idempotent. */
    private void markPaid(Order order, String razorpayPaymentId, String note) {
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.REFUND_PENDING) {
            return;
        }
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setPaidAt(Instant.now());
        order.setPaymentFailureReason(null);

        if (order.getStatus() == OrderStatus.AWAITING_PAYMENT) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.recordStatus(OrderStatus.PLACED, order.getCustomer(), note);
            events.publishEvent(OrderEvent.confirmed(order.getId()));
            log.info("Order {} paid online (payment {})", order.getOrderNumber(), razorpayPaymentId);
        } else {
            // Money arrived after the order was cancelled (customer cancel / expiry) - must be refunded.
            order.setPaymentStatus(PaymentStatus.REFUND_PENDING);
            log.warn("Payment {} captured for {} order {} - flagged REFUND_PENDING", razorpayPaymentId,
                    order.getStatus(), order.getOrderNumber());
        }
    }

    private void applyFailure(Order order, String razorpayPaymentId, String errorCode, String errorDescription) {
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT || order.getPaymentStatus() == PaymentStatus.PAID) {
            return; // a late/duplicate failure must never override a success
        }
        if (razorpayPaymentId != null && !razorpayPaymentId.isBlank()) {
            order.setRazorpayPaymentId(razorpayPaymentId);
        }
        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setPaymentFailureReason(failureReason(errorCode, errorDescription));
        log.info("Payment attempt failed for order {}: {}", order.getOrderNumber(), order.getPaymentFailureReason());
    }

    private Order lockCustomerOrder(Long customerId, Long orderId) {
        return orderRepository.lockByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
    }

    private static void requireSameRazorpayOrder(Order order, String razorpayOrderId) {
        if (order.getRazorpayOrderId() == null || !Objects.equals(order.getRazorpayOrderId(), razorpayOrderId)) {
            throw new BadRequestException("Payment does not belong to this order");
        }
    }

    static long toPaise(BigDecimal rupees) {
        return rupees.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }

    private static String failureReason(String code, String description) {
        boolean noCode = code == null || code.isBlank();
        boolean noDescription = description == null || description.isBlank();
        if (noCode && noDescription) {
            return "Payment not completed";
        }
        String reason = noCode ? description : noDescription ? code : code + ": " + description;
        return reason.length() > 255 ? reason.substring(0, 255) : reason;
    }
}
