package com.quickrider.controller.webhook;

import com.quickrider.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Razorpay -> QuickRider server-to-server webhook. Unauthenticated and CSRF-exempt (see SecurityConfig);
 * authenticity comes solely from the X-Razorpay-Signature HMAC over the raw body.
 * Configure in Razorpay dashboard (Test mode) -> Settings -> Webhooks:
 *   URL: https://&lt;public-host&gt;/api/public/payments/razorpay/webhook
 *   Events: payment.captured, payment.failed, order.paid
 */
@RestController
@RequestMapping("/api/public/payments/razorpay")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String rawBody,
                                        @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature) {
        return paymentService.handleWebhook(rawBody, signature)
                ? ResponseEntity.ok().build()
                : ResponseEntity.badRequest().build();
    }
}
