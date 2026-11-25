package com.quickrider.dto.response;

public record OwnerSummary(Long id, String fullName, String email, String phone, boolean enabled) {
}
