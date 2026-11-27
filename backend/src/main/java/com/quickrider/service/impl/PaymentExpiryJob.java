package com.quickrider.service.impl;

import com.quickrider.config.RazorpayProperties;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.repository.OrderRepository;
import com.quickrider.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Releases stock held by online orders that were never paid. Each order is handled in its own
 * transaction (PaymentService#expireIfUnpaid), which first reconciles with Razorpay.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentExpiryJob {

    private static final int BATCH = 50;

    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final RazorpayProperties properties;

    @Scheduled(initialDelay = 30_000, fixedDelayString = "${app.razorpay.expiry-check-interval-ms:60000}")
    public void run() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(properties.pendingPaymentExpiryMinutes()));
        List<Long> ids = orderRepository.findIdsByStatusCreatedBefore(OrderStatus.AWAITING_PAYMENT, cutoff,
                PageRequest.of(0, BATCH));
        for (Long id : ids) {
            try {
                paymentService.expireIfUnpaid(id);
            } catch (RuntimeException ex) {
                log.error("Could not expire unpaid order {}", id, ex);
            }
        }
    }
}
