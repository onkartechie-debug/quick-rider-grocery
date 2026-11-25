package com.quickrider.service;

import com.quickrider.dto.request.LoginRequest;
import com.quickrider.dto.request.RegisterRequest;
import com.quickrider.dto.response.AuthUserResponse;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    AuthUserResponse login(LoginRequest request, HttpServletResponse response);

    AuthUserResponse register(RegisterRequest request, HttpServletResponse response);

    AuthUserResponse currentUser(Long userId);

    void logout(HttpServletResponse response);
}
