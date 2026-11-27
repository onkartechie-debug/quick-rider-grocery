package com.quickrider.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickrider.config.RazorpayProperties;
import com.quickrider.dto.request.PaymentFailureRequest;
import com.quickrider.dto.request.VerifyPaymentRequest;
import com.quickrider.dto.response.PaymentCheckoutResponse;
import com.quickrider.entity.Order;
import com.quickrider.entity.OrderItem;
import com.quickrider.entity.Product;
import com.quickrider.entity.Shop;
import com.quickrider.entity.User;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.entity.enums.PaymentMethod;
import com.quickrider.entity.enums.PaymentStatus;
import com.quickrider.event.OrderEvent;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.PaymentGatewayException;
import com.quickrider.integration.razorpay.RazorpayClient;
import com.quickrider.integration.razorpay.RazorpayClient.RazorpayOrder;
import com.quickrider.integration.razorpay.RazorpaySignatures;
import com.quickrider.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    private static final String KEY_SECRET = "key_secret";
    private static final String WEBHOOK_SECRET = "webhook_secret";
    private static final long CUSTOMER_ID = 7L;

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private RazorpayClient razorpayClient;
    @Mock
    private ApplicationEventPublisher events;

    private PaymentServiceImpl service;
    private Order order;
    private Product product;

    @BeforeEach
    void setUp() {
        RazorpayProperties props = new RazorpayProperties("rzp_test_abc", KEY_SECRET, WEBHOOK_SECRET,
                "https://api.razorpay.com/v1", "QuickRider", 20, 60_000);
        service = new PaymentServiceImpl(orderRepository, razorpayClient, props, events, new ObjectMapper());

        User customer = new User();
        customer.setId(CUSTOMER_ID);
        customer.setFullName("Priya S");
        customer.setEmail("priya@example.com");
        Shop shop = new Shop();
        shop.setName("FreshMart");

        product = new Product();
        product.setStockQuantity(5);
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);

        order = new Order();
        order.setId(1L);
        order.setOrderNumber("QR-20261127-ABC123");
        order.setCustomer(customer);
        order.setShop(shop);
        order.setTotalAmount(new BigDecimal("249.50"));
        order.setSubtotal(new BigDecimal("219.50"));
        order.setDeliveryFee(new BigDecimal("30.00"));
        order.setDeliveryPhone("9876543210");
        order.setPaymentMethod(PaymentMethod.UPI);
        order.setCreatedAt(Instant.now());
        order.addItem(item);
        order.recordStatus(OrderStatus.AWAITING_PAYMENT, customer, "Waiting for online payment");
    }

    @Test
    void startCheckoutCreatesRazorpayOrderOnceInPaise() {
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));
        when(razorpayClient.createOrder(eq(24950L), eq(order.getOrderNumber()), anyMap()))
                .thenReturn(new RazorpayOrder("order_RZP1", 24950L, 0L, "INR", order.getOrderNumber(), "created"));
        when(razorpayClient.keyId()).thenReturn("rzp_test_abc");

        PaymentCheckoutResponse first = service.startCheckout(CUSTOMER_ID, 1L);
        PaymentCheckoutResponse retry = service.startCheckout(CUSTOMER_ID, 1L);

        assertThat(first.razorpayOrderId()).isEqualTo("order_RZP1");
        assertThat(first.amount()).isEqualTo(24950L);
        assertThat(first.testMode()).isTrue();
        assertThat(retry.razorpayOrderId()).isEqualTo("order_RZP1");
        verify(razorpayClient, org.mockito.Mockito.times(1)).createOrder(anyLong(), any(), anyMap());
    }

    @Test
    void startCheckoutRejectsCodOrders() {
        order.setPaymentMethod(PaymentMethod.COD);
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));
        assertThatThrownBy(() -> service.startCheckout(CUSTOMER_ID, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void verifyWithValidSignaturePlacesOrderAndPublishesConfirmation() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));
        String sig = RazorpaySignatures.sign("order_RZP1|pay_1", KEY_SECRET);

        service.verify(CUSTOMER_ID, 1L, new VerifyPaymentRequest("order_RZP1", "pay_1", sig));

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getRazorpayPaymentId()).isEqualTo("pay_1");
        verify(events).publishEvent(OrderEvent.confirmed(1L));
    }

    @Test
    void verifyWithTamperedSignatureChangesNothing() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.verify(CUSTOMER_ID, 1L,
                new VerifyPaymentRequest("order_RZP1", "pay_1", "deadbeef"))).isInstanceOf(BadRequestException.class);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(events, never()).publishEvent(any());
    }

    @Test
    void verifyRejectsPaymentForAnotherRazorpayOrder() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));
        String sig = RazorpaySignatures.sign("order_OTHER|pay_1", KEY_SECRET);

        assertThatThrownBy(() -> service.verify(CUSTOMER_ID, 1L,
                new VerifyPaymentRequest("order_OTHER", "pay_1", sig))).isInstanceOf(BadRequestException.class);
    }

    @Test
    void failureIsRecordedButNeverOverridesPaid() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByIdAndCustomerId(1L, CUSTOMER_ID)).thenReturn(Optional.of(order));

        service.recordFailure(CUSTOMER_ID, 1L, new PaymentFailureRequest("order_RZP1", "pay_x", "BAD_REQUEST_ERROR", "Card declined"));
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(order.getPaymentFailureReason()).isEqualTo("BAD_REQUEST_ERROR: Card declined");

        String sig = RazorpaySignatures.sign("order_RZP1|pay_2", KEY_SECRET);
        service.verify(CUSTOMER_ID, 1L, new VerifyPaymentRequest("order_RZP1", "pay_2", sig));
        service.recordFailure(CUSTOMER_ID, 1L, new PaymentFailureRequest("order_RZP1", null, null, "late dismiss"));

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getPaymentFailureReason()).isNull();
    }

    @Test
    void webhookCapturedMarksPaidAndIsIdempotent() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByRazorpayOrderId("order_RZP1")).thenReturn(Optional.of(order));
        String body = webhook("payment.captured", "pay_9", 24950);

        assertThat(service.handleWebhook(body, RazorpaySignatures.sign(body, WEBHOOK_SECRET))).isTrue();
        assertThat(service.handleWebhook(body, RazorpaySignatures.sign(body, WEBHOOK_SECRET))).isTrue();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        verify(events, org.mockito.Mockito.times(1)).publishEvent(OrderEvent.confirmed(1L));
    }

    @Test
    void webhookWithBadSignatureIsRejected() {
        String body = webhook("payment.captured", "pay_9", 24950);
        assertThat(service.handleWebhook(body, "bad")).isFalse();
        verify(orderRepository, never()).lockByRazorpayOrderId(any());
    }

    @Test
    void webhookWithAmountMismatchDoesNotMarkPaid() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockByRazorpayOrderId("order_RZP1")).thenReturn(Optional.of(order));
        String body = webhook("payment.captured", "pay_9", 100);

        assertThat(service.handleWebhook(body, RazorpaySignatures.sign(body, WEBHOOK_SECRET))).isTrue();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void paymentCapturedAfterCancellationIsFlaggedForRefund() {
        order.setRazorpayOrderId("order_RZP1");
        OrderServiceImpl.cancel(order, null, "Cancelled by customer");
        when(orderRepository.lockByRazorpayOrderId("order_RZP1")).thenReturn(Optional.of(order));
        String body = webhook("payment.captured", "pay_9", 24950);

        service.handleWebhook(body, RazorpaySignatures.sign(body, WEBHOOK_SECRET));

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.REFUND_PENDING);
    }

    @Test
    void expiryCancelsUnpaidOrderAndRestoresStock() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockById(1L)).thenReturn(Optional.of(order));
        when(razorpayClient.fetchOrder("order_RZP1"))
                .thenReturn(new RazorpayOrder("order_RZP1", 24950L, 0L, "INR", null, "attempted"));

        service.expireIfUnpaid(1L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getStockQuantity()).isEqualTo(7);
        verify(events).publishEvent(OrderEvent.statusChanged(1L, OrderStatus.CANCELLED));
    }

    @Test
    void expiryReconcilesOrderThatWasActuallyPaid() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockById(1L)).thenReturn(Optional.of(order));
        when(razorpayClient.fetchOrder("order_RZP1"))
                .thenReturn(new RazorpayOrder("order_RZP1", 24950L, 24950L, "INR", null, "paid"));
        when(razorpayClient.findCapturedPaymentId("order_RZP1")).thenReturn(Optional.of("pay_late"));

        service.expireIfUnpaid(1L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getRazorpayPaymentId()).isEqualTo("pay_late");
        assertThat(product.getStockQuantity()).isEqualTo(5);
    }

    @Test
    void expiryIsSkippedWhenGatewayUnreachable() {
        order.setRazorpayOrderId("order_RZP1");
        when(orderRepository.lockById(1L)).thenReturn(Optional.of(order));
        when(razorpayClient.fetchOrder("order_RZP1")).thenThrow(new PaymentGatewayException("down", null));

        service.expireIfUnpaid(1L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
    }

    @Test
    void toPaiseHandlesFractions() {
        assertThat(PaymentServiceImpl.toPaise(new BigDecimal("249.5"))).isEqualTo(24950L);
        assertThat(PaymentServiceImpl.toPaise(new BigDecimal("10"))).isEqualTo(1000L);
    }

    private static String webhook(String event, String paymentId, long amountPaise) {
        return "{\"event\":\"" + event + "\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"" + paymentId
                + "\",\"order_id\":\"order_RZP1\",\"amount\":" + amountPaise + ",\"status\":\"captured\"}}}}";
    }
}
