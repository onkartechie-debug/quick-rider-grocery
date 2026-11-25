package com.quickrider.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

/**
 * Admin shop onboarding. Exactly one of {@code existingShopkeeperId} (an unassigned shopkeeper)
 * or {@code newShopkeeper} (account created in the same transaction) must be supplied.
 */
public record CreateShopRequest(
        @NotNull(message = "Shop details are required")
        @Valid
        ShopRequest shop,

        Long existingShopkeeperId,

        @Valid
        NewShopkeeperRequest newShopkeeper
) {

    @AssertTrue(message = "Provide either an existing shopkeeper or new shopkeeper details, not both")
    public boolean isExactlyOneShopkeeper() {
        return (existingShopkeeperId != null) ^ (newShopkeeper != null);
    }
}
