package com.quickrider.service.impl;

import com.quickrider.config.OtpProperties;
import com.quickrider.dto.request.OtpVerifyRequest;
import com.quickrider.entity.OtpChallenge;
import com.quickrider.entity.User;
import com.quickrider.exception.BadRequestException;
import com.quickrider.integration.sms.SmsSender;
import com.quickrider.repository.OtpChallengeRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.security.jwt.AuthCookieService;
import com.quickrider.security.jwt.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    private static final String PHONE = "9876543210";

    @Mock
    private OtpChallengeRepository challengeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SmsSender smsSender;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthCookieService cookieService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final HttpServletResponse response = mock(HttpServletResponse.class);
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(5L);
        user.setPhone(PHONE);
        user.setEmail("priya@example.com");
        user.setEnabled(true);
    }

    private OtpServiceImpl service(String masterOtp) {
        return new OtpServiceImpl(challengeRepository, userRepository, encoder, smsSender, jwtService, cookieService,
                new OtpProperties(masterOtp, 6, 5, 5, 30, 5));
    }

    @Test
    void requestSendsSixDigitCodeAndStoresOnlyItsHash() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.empty());

        service("111111").requestLoginOtp(PHONE);

        ArgumentCaptor<String> sms = ArgumentCaptor.forClass(String.class);
        verify(smsSender).send(eq(PHONE), sms.capture());
        String code = sms.getValue().substring(0, 6);
        assertThat(code).matches("\\d{6}");
        ArgumentCaptor<OtpChallenge> saved = ArgumentCaptor.forClass(OtpChallenge.class);
        verify(challengeRepository).save(saved.capture());
        assertThat(saved.getValue().getCodeHash()).isNotEqualTo(code);
        assertThat(encoder.matches(code, saved.getValue().getCodeHash())).isTrue();
    }

    @Test
    void unknownNumberGetsSameResponseButNoSms() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of());
        assertThat(service("111111").requestLoginOtp(PHONE).message()).contains("If this number is registered");
        verify(smsSender, never()).send(anyString(), anyString());
    }

    @Test
    void resendWithinCooldownDoesNotSendAgain() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        OtpChallenge recent = challenge("123456", Instant.now().minusSeconds(10));
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.of(recent));

        assertThat(service("111111").requestLoginOtp(PHONE).resendAfterSeconds()).isBetween(1L, 30L);
        verify(smsSender, never()).send(anyString(), anyString());
    }

    @Test
    void masterOtpLogsInRegisteredUser() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt");

        assertThat(service("111111").verifyLoginOtp(new OtpVerifyRequest(PHONE, "111111"), response).id()).isEqualTo(5L);
        verify(cookieService).writeAccessToken(eq(response), eq("jwt"), any());
    }

    @Test
    void masterOtpRejectedWhenDisabled() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service("").verifyLoginOtp(new OtpVerifyRequest(PHONE, "111111"), response))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void masterOtpNeverCreatesOrRevealsAccountsForUnknownNumbers() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of());
        assertThatThrownBy(() -> service("111111").verifyLoginOtp(new OtpVerifyRequest(PHONE, "111111"), response))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void correctCodeLogsInOnceThenIsConsumed() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        OtpChallenge c = challenge("482913", Instant.now());
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.of(c));
        when(jwtService.generateToken(any())).thenReturn("jwt");
        OtpServiceImpl svc = service("");

        svc.verifyLoginOtp(new OtpVerifyRequest(PHONE, "482913"), response);
        assertThat(c.getConsumedAt()).isNotNull();
        assertThatThrownBy(() -> svc.verifyLoginOtp(new OtpVerifyRequest(PHONE, "482913"), response))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void wrongCodesCountAttemptsAndLockAfterMax() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        OtpChallenge c = challenge("482913", Instant.now());
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.of(c));
        OtpServiceImpl svc = service("");

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> svc.verifyLoginOtp(new OtpVerifyRequest(PHONE, "000000"), response))
                    .isInstanceOf(BadRequestException.class);
        }
        assertThat(c.getAttempts()).isEqualTo(5);
        assertThatThrownBy(() -> svc.verifyLoginOtp(new OtpVerifyRequest(PHONE, "482913"), response))
                .hasMessageContaining("Too many wrong attempts");
    }

    @Test
    void expiredCodeRejected() {
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user));
        OtpChallenge c = challenge("482913", Instant.now().minus(Duration.ofMinutes(10)));
        c.setExpiresAt(Instant.now().minusSeconds(1));
        when(challengeRepository.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(PHONE, "LOGIN")).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service("").verifyLoginOtp(new OtpVerifyRequest(PHONE, "482913"), response))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void sharedNumberIsRefused() {
        User other = new User();
        other.setEnabled(true);
        when(userRepository.findByPhone(PHONE)).thenReturn(List.of(user, other));
        assertThatThrownBy(() -> service("111111").verifyLoginOtp(new OtpVerifyRequest(PHONE, "111111"), response))
                .isInstanceOf(BadRequestException.class);
    }

    private OtpChallenge challenge(String code, Instant createdAt) {
        OtpChallenge c = new OtpChallenge();
        c.setPhone(PHONE);
        c.setPurpose("LOGIN");
        c.setCodeHash(encoder.encode(code));
        c.setCreatedAt(createdAt);
        c.setExpiresAt(createdAt.plus(Duration.ofMinutes(5)));
        return c;
    }
}
