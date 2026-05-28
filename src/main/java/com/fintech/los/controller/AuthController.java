package com.fintech.los.controller;

import com.fintech.los.common.dto.AuthDtos.*;
import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.auth.repository.UserRepository;
import com.fintech.los.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    private static final int ACCESS_TOKEN_SECONDS  = 15 * 60;       // 15 minutes
    private static final int REFRESH_TOKEN_SECONDS = 7 * 24 * 3600; // 7 days

    // -------------------------------------------------------------------------
    // Public endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/send-otp")
    public ApiResponse<Void> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ApiResponse.<Void>builder().timestamp(Instant.now()).success(true).message("OTP sent").build();
    }

    @PostMapping("/verify-otp")
    public ApiResponse<OtpVerifyResponse> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletResponse response) {
        OtpVerifyResponse data = authService.verifyOtp(request);
        if (data.getAuthResponse() != null) {
            setAuthCookies(response, data.getAuthResponse());
            // Strip tokens from response body — they are now in HttpOnly cookies
            data.getAuthResponse().setAccessToken(null);
            data.getAuthResponse().setRefreshToken(null);
        }
        return ApiResponse.<OtpVerifyResponse>builder()
                .timestamp(Instant.now()).success(true).message("OTP verified").data(data).build();
    }

    @PostMapping("/register-profile")
    public ApiResponse<AuthResponse> registerProfile(
            @Valid @RequestBody RegisterProfileRequest request,
            HttpServletResponse response) {
        AuthResponse auth = authService.registerProfile(request);
        setAuthCookies(response, auth);
        auth.setAccessToken(null);
        auth.setRefreshToken(null);
        return ApiResponse.<AuthResponse>builder()
                .timestamp(Instant.now()).success(true).message("Profile registered").data(auth).build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        setAuthCookies(response, auth);
        auth.setAccessToken(null);
        auth.setRefreshToken(null);
        return ApiResponse.<AuthResponse>builder()
                .timestamp(Instant.now()).success(true).message("Login success").data(auth).build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        // Read refresh token from HttpOnly cookie first, fall back to request body
        String refreshToken = extractCookieValue(request, "refresh_token");
        if (refreshToken == null) {
            return ApiResponse.<AuthResponse>builder()
                    .timestamp(Instant.now()).success(false).message("No refresh token provided").build();
        }
        TokenRefreshRequest refreshRequest = new TokenRefreshRequest();
        refreshRequest.setRefreshToken(refreshToken);
        AuthResponse auth = authService.refresh(refreshRequest);
        setAuthCookies(response, auth);
        auth.setAccessToken(null);
        auth.setRefreshToken(null);
        return ApiResponse.<AuthResponse>builder()
                .timestamp(Instant.now()).success(true).message("Token refreshed").data(auth).build();
    }

    // -------------------------------------------------------------------------
    // Authenticated endpoints
    // -------------------------------------------------------------------------

    /**
     * Returns the current user's profile fetched from DB, keyed by the
     * verified JWT subject (userId). No PII is ever stored client-side.
     */
    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> profile = Map.of(
                "userId",     user.getId(),
                "role",       user.getRole().name(),
                "name",       user.getFullName() != null ? user.getFullName() : "",
                "mobile",     user.getMobile(),
                "email",      user.getEmail() != null ? user.getEmail() : "",
                "customerId", user.getCustomerId() != null ? user.getCustomerId() : ""
        );
        return ApiResponse.<Map<String, Object>>builder()
                .timestamp(Instant.now()).success(true).message("Profile fetched").data(profile).build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {
        clearAuthCookies(response);
        return ApiResponse.<Void>builder()
                .timestamp(Instant.now()).success(true).message("Logged out successfully").build();
    }

    // Keep legacy OTP debug endpoint (restrict in production)
    @GetMapping("/get-otp/{mobile}")
    public ApiResponse<OtpResponse> getOtp(@PathVariable String mobile) {
        return ApiResponse.<OtpResponse>builder()
                .timestamp(Instant.now()).success(true).message("OTP retrieved")
                .data(authService.getOtp(mobile)).build();
    }

    // -------------------------------------------------------------------------
    // Cookie helpers
    // -------------------------------------------------------------------------

    private void setAuthCookies(HttpServletResponse response, AuthResponse auth) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", auth.getAccessToken())
                .httpOnly(true)
                .secure(false)        // set to true when HTTPS is enabled in production
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofSeconds(ACCESS_TOKEN_SECONDS))
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", auth.getRefreshToken())
                .httpOnly(true)
                .secure(false)        // set to true when HTTPS is enabled in production
                .sameSite("Strict")
                .path("/api/v1/auth/refresh")  // scoped: only sent to the refresh endpoint
                .maxAge(Duration.ofSeconds(REFRESH_TOKEN_SECONDS))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true).secure(false).sameSite("Strict")
                .path("/").maxAge(0).build();
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true).secure(false).sameSite("Strict")
                .path("/api/v1/auth/refresh").maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }
}
