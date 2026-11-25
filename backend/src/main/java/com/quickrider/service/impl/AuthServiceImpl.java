package com.quickrider.service.impl;

import com.quickrider.dto.request.LoginRequest;
import com.quickrider.dto.request.RegisterRequest;
import com.quickrider.dto.response.AuthUserResponse;
import com.quickrider.entity.User;
import com.quickrider.entity.enums.Role;
import com.quickrider.exception.ConflictException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.repository.UserRepository;
import com.quickrider.security.UserPrincipal;
import com.quickrider.security.jwt.AuthCookieService;
import com.quickrider.security.jwt.JwtService;
import com.quickrider.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthCookieService cookieService;

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse login(LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizeEmail(request.email()), request.password()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        issueCookie(principal, response);
        return currentUser(principal.getId());
    }

    @Override
    @Transactional
    public AuthUserResponse register(RegisterRequest request, HttpServletResponse response) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(StringUtils.hasText(request.phone()) ? request.phone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);
        user.setEnabled(true);
        User saved = userRepository.save(user);

        issueCookie(new UserPrincipal(saved), response);
        return AuthUserResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse currentUser(Long userId) {
        return userRepository.findById(userId)
                .map(AuthUserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public void logout(HttpServletResponse response) {
        cookieService.clearAccessToken(response);
    }

    private void issueCookie(UserPrincipal principal, HttpServletResponse response) {
        String token = jwtService.generateToken(principal);
        cookieService.writeAccessToken(response, token, jwtService.getTtl());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
