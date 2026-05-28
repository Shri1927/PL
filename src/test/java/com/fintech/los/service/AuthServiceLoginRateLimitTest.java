package com.fintech.los.service;

import com.fintech.los.common.dto.AuthDtos.LoginRequest;
import com.fintech.los.common.exception.BusinessException;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.auth.repository.RefreshTokenRepository;
import com.fintech.los.domain.auth.repository.UserRepository;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import com.fintech.los.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthService — Login Rate Limiting Tests")
class AuthServiceLoginRateLimitTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;

    @InjectMocks
    AuthService authService;

    @BeforeEach
    void setup() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------------------------------------------------------------------------
    // Test 1: Login succeeds and clears failure counter
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("✅ Successful login clears the failure counter in Redis")
    void successfulLogin_clearsFailureCounter() {
        LoginRequest req = new LoginRequest();
        req.setMobile("9876543210");
        req.setPassword("secret");

        User user = mockUser("9876543210");

        // No existing lock
        when(redisTemplate.hasKey("login:lock:9876543210")).thenReturn(false);
        when(userRepository.findByMobile("9876543210")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hashed_secret")).thenReturn(true);
        when(jwtService.generateAccessToken(anyString(), anyMap())).thenReturn("access_token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh_token");

        authService.login(req);

        // Verify the failure counter Redis key was deleted after success
        verify(redisTemplate).delete("login:fail:9876543210");
    }

    // -------------------------------------------------------------------------
    // Test 2: Account locked after 5 failures — further attempts blocked
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🔒 Login is blocked when the lockout key exists in Redis")
    void lockedAccount_throwsBusinessException() {
        LoginRequest req = new LoginRequest();
        req.setMobile("9876543210");
        req.setPassword("wrong");

        // Simulate lock already set
        when(redisTemplate.hasKey("login:lock:9876543210")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("temporarily locked");
    }

    // -------------------------------------------------------------------------
    // Test 3: Wrong password increments the failure counter
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("❌ Wrong password increments the Redis failure counter")
    void wrongPassword_incrementsFailureCounter() {
        LoginRequest req = new LoginRequest();
        req.setMobile("9876543210");
        req.setPassword("wrong");

        User user = mockUser("9876543210");

        when(redisTemplate.hasKey("login:lock:9876543210")).thenReturn(false);
        when(userRepository.findByMobile("9876543210")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed_secret")).thenReturn(false);
        // Return count below threshold so it doesn't lock yet
        when(valueOps.increment("login:fail:9876543210")).thenReturn(2L);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid credentials");

        // Failure counter was incremented
        verify(valueOps).increment("login:fail:9876543210");
        // TTL was set on the failure key
        verify(redisTemplate).expire(eq("login:fail:9876543210"), eq(10L), eq(TimeUnit.MINUTES));
    }

    // -------------------------------------------------------------------------
    // Test 4: 5th failure triggers lockout and sets lock key in Redis
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🔐 5th failed attempt triggers account lockout and sets Redis lock key")
    void fifthFailure_triggersLockout() {
        LoginRequest req = new LoginRequest();
        req.setMobile("9876543210");
        req.setPassword("wrong");

        User user = mockUser("9876543210");

        when(redisTemplate.hasKey("login:lock:9876543210")).thenReturn(false);
        when(userRepository.findByMobile("9876543210")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed_secret")).thenReturn(false);
        // 5th attempt — threshold hit
        when(valueOps.increment("login:fail:9876543210")).thenReturn(5L);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("temporarily locked");

        // Lock key was set
        verify(valueOps).set(eq("login:lock:9876543210"), eq("1"), eq(10L), eq(TimeUnit.MINUTES));
        // Failure counter was cleaned up
        verify(redisTemplate).delete("login:fail:9876543210");
    }

    // -------------------------------------------------------------------------
    // Test 5: Non-existent user increments failure counter (no user enumeration)
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🕵️ Non-existent user returns 'Invalid credentials', not 'User not found'")
    void nonExistentUser_doesNotRevealUserExistence() {
        LoginRequest req = new LoginRequest();
        req.setMobile("0000000000");
        req.setPassword("any");

        when(redisTemplate.hasKey("login:lock:0000000000")).thenReturn(false);
        when(userRepository.findByMobile("0000000000")).thenReturn(Optional.empty());
        when(valueOps.increment("login:fail:0000000000")).thenReturn(1L);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid credentials");  // NOT "User not found"
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private User mockUser(String mobile) {
        User user = new User();
        user.setId(1L);
        user.setMobile(mobile);
        user.setPasswordHash("hashed_secret");
        user.setRole(UserRole.CUSTOMER);
        return user;
    }
}
