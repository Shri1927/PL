package com.fintech.los.common.dto;

import com.fintech.los.domain.loan.LoanEnums.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

public final class AuthDtos {
    private AuthDtos() {
    }

    @Data
    public static class SendOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid mobile number. Must be 10 digits and start with 6, 7, 8, or 9.")
        private String mobile;
    }

    @Data
    public static class RegisterProfileRequest {
        @NotBlank
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid mobile number. Must be 10 digits and start with 6, 7, 8, or 9.")
        private String mobile;
        @NotBlank
        @Pattern(regexp = "^(?=.*[a-zA-Z]).{2,}$", message = "Full Name must contain at least one letter and cannot be only special characters or numbers.")
        private String fullName;
        @Email
        private String email;
        @NotBlank(message = "Security Key is required")
        @Size(min = 8, max = 32, message = "Security Key must be between 8 and 32 characters")
        private String password;
        @NotBlank
        private String city;
        // BUG-003: @Past rejects any date >= today at Bean Validation layer (clean 400),
        // preventing extreme years from reaching the service. The service retains its own
        // 4-digit year check as a third line of defence for edge cases (e.g. year 0 or 999).
        @NotNull(message = "Date of Birth is required")
        @Past(message = "Date of Birth must be in the past")
        private LocalDate dob;
        @NotNull
        private EmploymentType employmentType;
    }

    @Data
    public static class LoginRequest {
        @NotBlank
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid mobile number. Must be 10 digits and start with 6, 7, 8, or 9.")
        private String mobile;
        @NotBlank
        private String password;
    }

    @Data
    public static class OtpVerifyRequest {
        @NotBlank
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid mobile number. Must be 10 digits and start with 6, 7, 8, or 9.")
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
        private String fullName;
        private String mobile;
        private String email;
    }

    @Data
    public static class OtpResponse {
        private String otp;
        private boolean found;
    }
}
