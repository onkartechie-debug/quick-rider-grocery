package com.quickrider.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(@NotNull Jwt jwt, @NotNull Cookie cookie, @NotNull Cors cors) {

    public record Jwt(@NotBlank String secret, @Min(1) long expirationMinutes, @NotBlank String issuer) {
    }

    public record Cookie(@NotBlank String name, boolean secure, @NotBlank String sameSite, @NotBlank String path) {
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
