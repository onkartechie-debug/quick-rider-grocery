package com.quickrider.entity.enums;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Order lifecycle: PLACED -> ACCEPTED -> PACKING -> OUT_FOR_DELIVERY -> DELIVERED.
 * CANCELLED is reachable from PLACED, ACCEPTED and PACKING.
 */
public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PACKING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED;

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(PLACED, EnumSet.of(ACCEPTED, CANCELLED));
        TRANSITIONS.put(ACCEPTED, EnumSet.of(PACKING, CANCELLED));
        TRANSITIONS.put(PACKING, EnumSet.of(OUT_FOR_DELIVERY, CANCELLED));
        TRANSITIONS.put(OUT_FOR_DELIVERY, EnumSet.of(DELIVERED));
        TRANSITIONS.put(DELIVERED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(CANCELLED, EnumSet.noneOf(OrderStatus.class));
    }

    public boolean canTransitionTo(OrderStatus target) {
        return TRANSITIONS.get(this).contains(target);
    }

    public Set<OrderStatus> nextStatuses() {
        return Collections.unmodifiableSet(TRANSITIONS.get(this));
    }

    public boolean isActive() {
        return this != DELIVERED && this != CANCELLED;
    }
}
