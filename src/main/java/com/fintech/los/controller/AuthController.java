package com.fintech.los.controller;

import com.fintech.los.common.dto.AuthDtos.*;
import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/send-otp")
    public ApiResponse<Void> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ApiResponse.<Void>builder().timestamp(Instant.now()).success(true).message("OTP sent").build();
    }

    @PostMapping("/verify-otp")
    public ApiResponse<OtpVerifyResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ApiResponse.<OtpVerifyResponse>builder().timestamp(Instant.now()).success(true).message("OTP verified")
                .data(authService.verifyOtp(request)).build();
    }

    @PostMapping("/register-profile")
    public ApiResponse<AuthResponse> registerProfile(@Valid @RequestBody RegisterProfileRequest request) {
        return ApiResponse.<AuthResponse>builder().timestamp(Instant.now()).success(true).message("Profile registered")
                .data(authService.registerProfile(request)).build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.<AuthResponse>builder().timestamp(Instant.now()).success(true).message("Login success")
                .data(authService.login(request)).build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ApiResponse.<AuthResponse>builder().timestamp(Instant.now()).success(true).message("Token refreshed")
                .data(authService.refresh(request)).build();
    }
}
