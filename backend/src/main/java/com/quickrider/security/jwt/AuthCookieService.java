package com.quickrider.security.jwt;

import com.quickrider.config.SecurityProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

/** Reads and writes the HttpOnly; Secure; SameSite=Strict access-token cookie. */
@Component
public class AuthCookieService {

    private final SecurityProperties.Cookie cookie;

    public AuthCookieService(SecurityProperties properties) {
        this.cookie = properties.cookie();
    }

    public void writeAccessToken(HttpServletResponse response, String token, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(token, maxAge).toString());
    }

    public void clearAccessToken(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, build("", Duration.ZERO).toString());
    }

    public Optional<String> readAccessToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(c -> cookie.name().equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst();
    }

    private ResponseCookie build(String value, Duration maxAge) {
        return ResponseCookie.from(cookie.name(), value)
                .httpOnly(true)
                .secure(cookie.secure())
                .sameSite(cookie.sameSite())
                .path(cookie.path())
                .maxAge(maxAge)
                .build();
    }
}
