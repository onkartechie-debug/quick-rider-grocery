package com.quickrider.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;

public record ProductRequest(
        @NotNull(message = "Category is required")
        Long categoryId,

        @NotBlank(message = "Product name is required")
        @Size(max = 150)
        String name,

        @Size(max = 500)
        String description,

        @NotBlank(message = "Unit is required (e.g. 500g, 1L, 1 pack)")
        @Size(max = 30)
        String unit,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2)
        BigDecimal price,

        @DecimalMin(value = "0.01", message = "Discounted price must be greater than 0")
        @Digits(integer = 8, fraction = 2)
        BigDecimal discountedPrice,

        @NotNull(message = "Stock quantity is required")
        @Min(value = 0, message = "Stock cannot be negative")
        @Max(value = 100000)
        Integer stockQuantity,

        @URL(protocol = "https", message = "Image URL must be a valid https URL")
        @Size(max = 500)
        String imageUrl,

        Boolean available
) {

    @AssertTrue(message = "Discounted price cannot be higher than the price")
    public boolean isDiscountValid() {
        return discountedPrice == null || price == null || discountedPrice.compareTo(price) <= 0;
    }
}
