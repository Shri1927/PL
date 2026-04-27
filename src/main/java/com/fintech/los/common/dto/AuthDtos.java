package com.fintech.los.common.dto;

import com.fintech.los.domain.loan.LoanEnums.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

public final class AuthDtos {
    private AuthDtos() {
    }

    @Data
    public static class SendOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$")
        private String mobile;
    }

    @Data
    public static class RegisterProfileRequest {
        @NotBlank
        private String mobile;
        @NotBlank
        private String fullName;
        @Email
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String city;
        @NotNull
        private LocalDate dob;
        @NotNull
        private EmploymentType employmentType;
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
    public static class OtpVerifyResponse {
        private boolean valid;
        private boolean isExistingUser;
        private AuthResponse authResponse;
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
        private String customerId;
    }
}
