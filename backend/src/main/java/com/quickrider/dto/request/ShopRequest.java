package com.quickrider.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.time.LocalTime;

public record ShopRequest(
        @NotBlank(message = "Shop name is required")
        @Size(max = 150)
        String name,

        @Size(max = 500)
        String description,

        @NotBlank(message = "Address is required")
        @Size(max = 300)
        String address,

        @NotBlank(message = "City is required")
        @Size(max = 80)
        String city,

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
        String pincode,

        @Pattern(regexp = "^$|^[0-9+\\- ]{6,20}$", message = "Enter a valid phone number")
        String phone,

        @NotNull(message = "Delivery radius is required")
        @DecimalMin(value = "0.5", message = "Radius must be at least 0.5 km")
        @DecimalMax(value = "50.0", message = "Radius cannot exceed 50 km")
        @Digits(integer = 3, fraction = 2)
        BigDecimal deliveryRadiusKm,

        @NotNull(message = "Opening time is required")
        LocalTime openingTime,

        @NotNull(message = "Closing time is required")
        LocalTime closingTime,

        @URL(protocol = "https", message = "Image URL must be a valid https URL")
        @Size(max = 500)
        String imageUrl,

        @DecimalMin(value = "0.0", message = "Minimum order cannot be negative")
        @Digits(integer = 8, fraction = 2)
        BigDecimal minOrderAmount,

        @DecimalMin(value = "0.0", message = "Delivery fee cannot be negative")
        @Digits(integer = 8, fraction = 2)
        BigDecimal deliveryFee
) {
}
