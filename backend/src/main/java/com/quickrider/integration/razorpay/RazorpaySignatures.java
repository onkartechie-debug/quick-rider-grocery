package com.quickrider.integration.razorpay;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * HMAC-SHA256 checks for Razorpay signatures:
 * <ul>
 *   <li>{@link #isValidPayment} - Checkout's {@code razorpay_signature} over {@code order_id|payment_id},
 *       keyed with the API key secret.</li>
 *   <li>{@link #isValidWebhook} - the {@code X-Razorpay-Signature} header over the raw webhook body,
 *       keyed with the dashboard webhook secret (a different credential).</li>
 * </ul>
 * Comparisons are constant-time.
 */
public final class RazorpaySignatures {

    private static final String HMAC = "HmacSHA256";

    private RazorpaySignatures() {
    }

    public static boolean isValidPayment(String orderId, String paymentId, String signature, String keySecret) {
        if (isBlank(orderId) || isBlank(paymentId)) {
            return false;
        }
        return matches(orderId + "|" + paymentId, signature, keySecret);
    }

    /** @param rawBody the body exactly as received - re-serialized JSON would not match. */
    public static boolean isValidWebhook(String rawBody, String signature, String webhookSecret) {
        if (rawBody == null) {
            return false;
        }
        return matches(rawBody, signature, webhookSecret);
    }

    public static String sign(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", ex);
        }
    }

    private static boolean matches(String payload, String signature, String secret) {
        if (isBlank(signature) || isBlank(secret)) {
            return false;
        }
        byte[] expected = sign(payload, secret).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, signature.trim().getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
