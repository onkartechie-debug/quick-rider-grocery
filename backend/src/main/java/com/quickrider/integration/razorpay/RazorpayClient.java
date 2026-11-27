package com.quickrider.integration.razorpay;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.quickrider.config.RazorpayProperties;
import com.quickrider.exception.PaymentGatewayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Thin client over Razorpay's Orders API (https://razorpay.com/docs/api/orders/). Same endpoints for
 * test and live mode - the key pair decides which. Payment confirmation itself is verified locally
 * via HMAC (RazorpaySignatures); the read calls here are only used to reconcile abandoned orders.
 */
@Slf4j
@Component
public class RazorpayClient {

    private final RestClient restClient;
    private final RazorpayProperties properties;

    public RazorpayClient(RestClient.Builder builder, RazorpayProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(20_000);
        this.restClient = builder
                .baseUrl(properties.apiBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeaders(h -> h.setBasicAuth(properties.keyId(), properties.keySecret()))
                .build();
        this.properties = properties;
        if (properties.testMode()) {
            log.info("Razorpay gateway in TEST mode (key {}) - no real money is moved", properties.keyId());
        } else {
            log.warn("Razorpay gateway in LIVE mode (key {})", properties.keyId());
        }
    }

    public String keyId() {
        return properties.keyId();
    }

    /** POST /orders - amount in paise (Razorpay's unit). */
    public RazorpayOrder createOrder(long amountPaise, String receipt, Map<String, String> notes) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", "INR");
        body.put("receipt", receipt);
        body.put("notes", notes);
        try {
            RazorpayOrder order = restClient.post().uri("/orders").body(body).retrieve().body(RazorpayOrder.class);
            if (order == null || order.id() == null) {
                throw new PaymentGatewayException("Razorpay returned an empty order for receipt " + receipt, null);
            }
            return order;
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Failed to create Razorpay order for receipt " + receipt, ex);
        }
    }

    /** GET /orders/{id} */
    public RazorpayOrder fetchOrder(String razorpayOrderId) {
        try {
            return restClient.get().uri("/orders/{id}", razorpayOrderId).retrieve().body(RazorpayOrder.class);
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Failed to fetch Razorpay order " + razorpayOrderId, ex);
        }
    }

    /** GET /orders/{id}/payments - the id of a captured payment against the order, if any. */
    public Optional<String> findCapturedPaymentId(String razorpayOrderId) {
        try {
            JsonNode payments = restClient.get().uri("/orders/{id}/payments", razorpayOrderId)
                    .retrieve().body(JsonNode.class);
            if (payments == null) {
                return Optional.empty();
            }
            for (JsonNode payment : payments.path("items")) {
                if ("captured".equals(payment.path("status").asText())) {
                    return Optional.of(payment.path("id").asText());
                }
            }
            return Optional.empty();
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Failed to fetch payments for Razorpay order " + razorpayOrderId, ex);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RazorpayOrder(String id, Long amount, Long amount_paid, String currency, String receipt, String status) {

        public boolean isPaid() {
            return "paid".equals(status);
        }
    }
}
