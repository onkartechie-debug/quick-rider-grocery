package com.quickrider.controller.auth;

import com.quickrider.dto.request.LoginRequest;
import com.quickrider.dto.request.OtpRequest;
import com.quickrider.dto.request.OtpVerifyRequest;
import com.quickrider.dto.request.RegisterRequest;
import com.quickrider.dto.response.AuthUserResponse;
import com.quickrider.dto.response.OtpRequestResponse;
import com.quickrider.service.OtpService;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    /**
     * Primes the XSRF-TOKEN cookie. The SPA calls this once on startup; Axios then copies the
     * cookie into the X-XSRF-TOKEN header on every state-changing request.
     */
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName());
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return authService.login(request, response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request,
                                                     HttpServletResponse response) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, response));
    }

    /** Sends a login OTP by SMS. Same response for unknown numbers (no account enumeration). */
    @PostMapping("/otp/request")
    public OtpRequestResponse requestOtp(@Valid @RequestBody OtpRequest request) {
        return otpService.requestLoginOtp(request.phone());
    }

    @PostMapping("/otp/verify")
    public AuthUserResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request, HttpServletResponse response) {
        return otpService.verifyLoginOtp(request, response);
    }

    @GetMapping("/me")
    public AuthUserResponse me(@CurrentUser UserPrincipal principal) {
        return authService.currentUser(principal.getId());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.noContent().build();
    }
}
