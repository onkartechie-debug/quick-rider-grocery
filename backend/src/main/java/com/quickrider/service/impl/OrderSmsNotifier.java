package com.quickrider.service.impl;

import com.quickrider.config.SmsProperties;
import com.quickrider.entity.Order;
import com.quickrider.entity.Shop;
import com.quickrider.entity.enums.PaymentStatus;
import com.quickrider.event.OrderEvent;
import com.quickrider.integration.sms.SmsSender;
import com.quickrider.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends order SMS after the triggering transaction commits, on a background thread, so the gateway's
 * latency or an outage never slows down or fails an order/payment request.
 * NOTE: in India every template below must be registered on DLT for the sender before going live.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSmsNotifier {

    private final OrderRepository orderRepository;
    private final SmsSender smsSender;
    private final SmsProperties smsProperties;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onOrderEvent(OrderEvent event) {
        try {
            orderRepository.findById(event.orderId()).ifPresent(order -> notify(order, event));
        } catch (Exception ex) {
            log.error("Could not send SMS for order {} ({})", event.orderId(), event.type(), ex);
        }
    }

    private void notify(Order order, OrderEvent event) {
        Shop shop = order.getShop();
        String customerPhone = order.getDeliveryPhone();
        String suffix = suffix();

        switch (event.type()) {
            case CONFIRMED -> {
                boolean paid = order.getPaymentStatus() == PaymentStatus.PAID;
                smsSender.send(customerPhone, "Your order " + order.getOrderNumber() + " of Rs." + order.getTotalAmount()
                        + " from " + shop.getName() + " is placed"
                        + (paid ? " and paid online" : " (cash on delivery)") + "." + suffix);
                smsSender.send(shop.getPhone(), "New order " + order.getOrderNumber() + ": " + order.getItems().size()
                        + " item(s), Rs." + order.getTotalAmount()
                        + (paid ? " (PAID ONLINE)" : " (COLLECT CASH)") + ". Please accept it in your dashboard." + suffix);
            }
            case STATUS_CHANGED -> {
                String text = switch (event.status()) {
                    case ACCEPTED -> shop.getName() + " has accepted your order " + order.getOrderNumber() + ".";
                    case OUT_FOR_DELIVERY -> "Your order " + order.getOrderNumber() + " is out for delivery.";
                    case DELIVERED -> "Your order " + order.getOrderNumber() + " has been delivered. Thank you!";
                    case CANCELLED -> "Your order " + order.getOrderNumber() + " was cancelled"
                            + (order.getCancelReason() != null ? ": " + order.getCancelReason() : "") + "."
                            + (order.getPaymentStatus() == PaymentStatus.REFUND_PENDING
                                ? " Your online payment will be refunded." : "");
                    default -> null; // PACKING etc. - no SMS, the app shows live status
                };
                if (text != null) {
                    smsSender.send(customerPhone, text + suffix);
                }
            }
        }
    }

    private String suffix() {
        String s = smsProperties.senderSuffix();
        return (s == null || s.isBlank()) ? "" : " " + s.trim();
    }
}
