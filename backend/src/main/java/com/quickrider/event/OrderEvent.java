package com.quickrider.event;

import com.quickrider.entity.enums.OrderStatus;

/**
 * Published inside the order/payment transaction; listeners run only after it commits
 * (see OrderSmsNotifier), so a rolled-back change never notifies anyone.
 */
public record OrderEvent(Long orderId, Type type, OrderStatus status) {

    public enum Type {
        /** A COD order was placed, or an online order's payment was confirmed - the shop now sees it. */
        CONFIRMED,
        /** The shop moved the order along the pipeline, or it was cancelled (incl. unpaid-order expiry). */
        STATUS_CHANGED
    }

    public static OrderEvent confirmed(Long orderId) {
        return new OrderEvent(orderId, Type.CONFIRMED, OrderStatus.PLACED);
    }

    public static OrderEvent statusChanged(Long orderId, OrderStatus status) {
        return new OrderEvent(orderId, Type.STATUS_CHANGED, status);
    }
}
