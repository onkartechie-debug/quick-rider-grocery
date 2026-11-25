package com.quickrider.dto.response;

import com.quickrider.entity.User;
import com.quickrider.entity.enums.Role;

public record AuthUserResponse(Long id, String fullName, String email, String phone, Role role) {

    public static AuthUserResponse from(User user) {
        return new AuthUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole());
    }
}
