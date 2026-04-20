package com.fintech.los.common.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public final class AuthDtos {
    private AuthDtos() {
    }

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String fullName;
        @Email
        private String email;
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$")
        private String mobile;
        @NotBlank
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank
        private String mobile;
        @NotBlank
        private String password;
    }

    @Data
    public static class OtpVerifyRequest {
        @NotBlank
        private String mobile;
        @NotBlank
        private String otp;
    }

    @Data
    public static class TokenRefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String role;
        @NotNull
        private Long userId;
    }
}
