package com.quickrider.service.impl;

import com.quickrider.config.OtpProperties;
import com.quickrider.dto.request.OtpVerifyRequest;
import com.quickrider.dto.response.AuthUserResponse;
import com.quickrider.dto.response.OtpRequestResponse;
import com.quickrider.entity.OtpChallenge;
import com.quickrider.entity.User;
import com.quickrider.exception.BadRequestException;
import com.quickrider.integration.sms.SmsSender;
import com.quickrider.repository.OtpChallengeRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.security.UserPrincipal;
import com.quickrider.security.jwt.AuthCookieService;
import com.quickrider.security.jwt.JwtService;
import com.quickrider.service.OtpService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * SMS OTP login, modelled on the KMD project's OTP flow (including its dev master OTP, default 111111).
 * Codes are random, stored only as a BCrypt hash, expire, allow limited attempts, and are single-use.
 */
@Slf4j
@Service
public class OtpServiceImpl implements OtpService {

    private static final String INVALID = "Invalid or expired OTP. Please try again.";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsSender smsSender;
    private final JwtService jwtService;
    private final AuthCookieService cookieService;
    private final OtpProperties properties;

    public OtpServiceImpl(OtpChallengeRepository challengeRepository, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, SmsSender smsSender, JwtService jwtService,
                          AuthCookieService cookieService, OtpProperties properties) {
        this.challengeRepository = challengeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.smsSender = smsSender;
        this.jwtService = jwtService;
        this.cookieService = cookieService;
        this.properties = properties;
        if (properties.masterOtpEnabled()) {
            log.warn("MASTER OTP is ENABLED - any registered mobile can log in with it. Set MASTER_OTP to an empty "
                    + "value outside local development/testing.");
        }
    }

    @Override
    @Transactional
    public OtpRequestResponse requestLoginOtp(String phone) {
        long ttl = Duration.ofMinutes(properties.expirationMinutes()).toSeconds();
        long cooldown = properties.resendCooldownSeconds();
        OtpRequestResponse generic = new OtpRequestResponse(
                "If this number is registered, an OTP has been sent to it.", ttl, cooldown);

        Optional<User> user = singleEnabledUser(phone);
        if (user.isEmpty()) {
            log.info("OTP requested for unregistered/ambiguous mobile ******{}", last4(phone));
            return generic;
        }

        Instant now = Instant.now();
        Optional<OtpChallenge> latest = challengeRepository
                .findFirstByPhoneAndPurposeOrderByCreatedAtDesc(phone, OtpChallenge.PURPOSE_LOGIN);
        if (latest.isPresent()) {
            long since = Duration.between(latest.get().getCreatedAt(), now).toSeconds();
            if (since < cooldown) {
                return new OtpRequestResponse(generic.message(), ttl, cooldown - since);
            }
        }
        long lastHour = challengeRepository.countByPhoneAndPurposeAndCreatedAtAfter(
                phone, OtpChallenge.PURPOSE_LOGIN, now.minus(Duration.ofHours(1)));
        if (lastHour >= properties.maxPerHour()) {
            throw new BadRequestException("Too many OTP requests. Please try again later or sign in with your password.");
        }

        String code = generateCode();
        OtpChallenge challenge = new OtpChallenge();
        challenge.setPhone(phone);
        challenge.setPurpose(OtpChallenge.PURPOSE_LOGIN);
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(now.plusSeconds(ttl));
        challenge.setCreatedAt(now);
        challengeRepository.save(challenge);

        smsSender.send(phone, code + " is your QuickRider login OTP. It is valid for " + properties.expirationMinutes()
                + " minutes. Do not share it with anyone.");
        return generic;
    }

    @Override
    // Failed attempts must be persisted even though the request then fails.
    @Transactional(noRollbackFor = BadRequestException.class)
    public AuthUserResponse verifyLoginOtp(OtpVerifyRequest request, HttpServletResponse response) {
        String phone = request.phone();
        User user = singleEnabledUser(phone).orElseThrow(() -> new BadRequestException(INVALID));

        if (properties.masterOtpEnabled() && constantTimeEquals(properties.masterOtp(), request.otp())) {
            log.warn("User {} logged in with the MASTER OTP", user.getId());
            return signIn(user, response);
        }

        OtpChallenge challenge = challengeRepository
                .findFirstByPhoneAndPurposeOrderByCreatedAtDesc(phone, OtpChallenge.PURPOSE_LOGIN)
                .orElseThrow(() -> new BadRequestException(INVALID));
        Instant now = Instant.now();
        if (challenge.getConsumedAt() != null || now.isAfter(challenge.getExpiresAt())) {
            throw new BadRequestException(INVALID);
        }
        if (challenge.getAttempts() >= properties.maxAttempts()) {
            throw new BadRequestException("Too many wrong attempts. Please request a new OTP.");
        }
        if (!passwordEncoder.matches(request.otp(), challenge.getCodeHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            throw new BadRequestException(INVALID);
        }
        challenge.setConsumedAt(now);
        return signIn(user, response);
    }

    private AuthUserResponse signIn(User user, HttpServletResponse response) {
        String token = jwtService.generateToken(new UserPrincipal(user));
        cookieService.writeAccessToken(response, token, jwtService.getTtl());
        return AuthUserResponse.from(user);
    }

    private Optional<User> singleEnabledUser(String phone) {
        List<User> matches = userRepository.findByPhone(phone).stream().filter(User::isEnabled).toList();
        if (matches.size() > 1) {
            log.warn("OTP login refused: {} accounts share mobile ******{}", matches.size(), last4(phone));
            return Optional.empty();
        }
        return matches.stream().findFirst();
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, properties.length());
        return String.format("%0" + properties.length() + "d", RANDOM.nextInt(bound));
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.trim().getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static String last4(String phone) {
        return phone != null && phone.length() >= 4 ? phone.substring(phone.length() - 4) : "****";
    }
}
