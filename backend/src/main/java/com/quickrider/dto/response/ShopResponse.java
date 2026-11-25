package com.quickrider.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;

/** {@code owner} is only populated for admin and shopkeeper views; public responses omit it. */
public record ShopResponse(
        Long id,
        String name,
        String description,
        String address,
        String city,
        String pincode,
        String phone,
        BigDecimal deliveryRadiusKm,
        @JsonFormat(pattern = "HH:mm") LocalTime openingTime,
        @JsonFormat(pattern = "HH:mm") LocalTime closingTime,
        String imageUrl,
        BigDecimal minOrderAmount,
        BigDecimal deliveryFee,
        BigDecimal rating,
        boolean active,
        boolean openNow,
        OwnerSummary owner,
        Instant createdAt
) {
}
