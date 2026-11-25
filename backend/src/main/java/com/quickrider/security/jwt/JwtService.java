package com.quickrider.security.jwt;

import com.quickrider.config.SecurityProperties;
import com.quickrider.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final Duration ttl;

    public JwtService(SecurityProperties properties) {
        byte[] keyBytes = Decoders.BASE64.decode(properties.jwt().secret());
        if (keyBytes.length < 32) {
            throw new IllegalStateException("app.security.jwt.secret must decode to at least 256 bits");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.issuer = properties.jwt().issuer();
        this.ttl = Duration.ofMinutes(properties.jwt().expirationMinutes());
    }

    public String generateToken(UserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(String.valueOf(principal.getId()))
                .claim("role", principal.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** Returns the user id for a valid token, or empty if the token is invalid or expired. */
    public Optional<Long> extractUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(Long.valueOf(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public Duration getTtl() {
        return ttl;
    }
}
