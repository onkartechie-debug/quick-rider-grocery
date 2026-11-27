package com.quickrider.service;

import com.quickrider.dto.request.OtpVerifyRequest;
import com.quickrider.dto.response.AuthUserResponse;
import com.quickrider.dto.response.OtpRequestResponse;
import jakarta.servlet.http.HttpServletResponse;

/** Passwordless login: a one-time code sent by SMS to the account's registered mobile number. */
public interface OtpService {

    OtpRequestResponse requestLoginOtp(String phone);

    /** Verifies the code and, on success, sets the auth cookie exactly like password login. */
    AuthUserResponse verifyLoginOtp(OtpVerifyRequest request, HttpServletResponse response);
}
