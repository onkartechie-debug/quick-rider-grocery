package com.quickrider.controller.customer;

import com.quickrider.dto.request.PaymentFailureRequest;
import com.quickrider.dto.request.VerifyPaymentRequest;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PaymentCheckoutResponse;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Razorpay Checkout flow for an order placed with UPI/CARD (status AWAITING_PAYMENT). */
@RestController
@RequestMapping("/api/customer/orders/{orderId}/payment")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerPaymentController {

    private final PaymentService paymentService;

    /** Creates/reuses the Razorpay order; the response is passed straight to Checkout.js. */
    @PostMapping
    public PaymentCheckoutResponse start(@CurrentUser UserPrincipal user, @PathVariable Long orderId) {
        return paymentService.startCheckout(user.getId(), orderId);
    }

    /** Checkout success handler - the signature is verified server-side before the order is marked paid. */
    @PostMapping("/verify")
    public OrderResponse verify(@CurrentUser UserPrincipal user, @PathVariable Long orderId,
                                @Valid @RequestBody VerifyPaymentRequest request) {
        return paymentService.verify(user.getId(), orderId, request);
    }

    /** Checkout {@code payment.failed} / {@code modal.ondismiss} handler. */
    @PostMapping("/failure")
    public OrderResponse failure(@CurrentUser UserPrincipal user, @PathVariable Long orderId,
                                 @Valid @RequestBody PaymentFailureRequest request) {
        return paymentService.recordFailure(user.getId(), orderId, request);
    }
}
