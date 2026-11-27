package com.quickrider.integration.razorpay;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RazorpaySignaturesTest {

    private static final String SECRET = "test_secret";

    @Test
    void acceptsValidPaymentSignature() {
        String sig = RazorpaySignatures.sign("order_1|pay_1", SECRET);
        assertThat(RazorpaySignatures.isValidPayment("order_1", "pay_1", sig, SECRET)).isTrue();
    }

    @Test
    void rejectsTamperedPaymentSignature() {
        String sig = RazorpaySignatures.sign("order_1|pay_1", SECRET);
        assertThat(RazorpaySignatures.isValidPayment("order_1", "pay_2", sig, SECRET)).isFalse();
        assertThat(RazorpaySignatures.isValidPayment("order_1", "pay_1", sig, "other")).isFalse();
        assertThat(RazorpaySignatures.isValidPayment("order_1", "pay_1", null, SECRET)).isFalse();
        assertThat(RazorpaySignatures.isValidPayment(null, "pay_1", sig, SECRET)).isFalse();
    }

    @Test
    void webhookSignatureCoversRawBodyAndNeedsSecret() {
        String body = "{\"event\":\"payment.captured\"}";
        String sig = RazorpaySignatures.sign(body, SECRET);
        assertThat(RazorpaySignatures.isValidWebhook(body, sig, SECRET)).isTrue();
        assertThat(RazorpaySignatures.isValidWebhook(body + " ", sig, SECRET)).isFalse();
        assertThat(RazorpaySignatures.isValidWebhook(body, sig, "")).isFalse();
    }

    @Test
    void knownVector() {
        // HMAC-SHA256("abc", key "key")
        assertThat(RazorpaySignatures.sign("abc", "key"))
                .isEqualTo("9c196e32dc0175f86f4b1cb89289d6619de6bee699e4c378e68309ed97a1a6ab");
    }
}
