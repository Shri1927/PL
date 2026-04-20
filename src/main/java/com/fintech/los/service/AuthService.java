package com.fintech.los.service;

import com.fintech.los.common.dto.AuthDtos.*;
import com.fintech.los.common.exception.BusinessException;
import com.fintech.los.domain.auth.RefreshToken;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.auth.repository.RefreshTokenRepository;
import com.fintech.los.domain.auth.repository.UserRepository;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import com.fintech.los.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int MAX_OTP_VERIFY_ATTEMPTS = 3;
    private static final int OTP_LOCK_MINUTES = 10;
    private static final int MAX_OTP_SEND_PER_MINUTE = 5;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    public void register(RegisterRequest request) {
        enforceOtpSendRateLimit(request.getMobile());
        if (userRepository.findByMobile(request.getMobile()).isPresent()) {
            throw new BusinessException("Mobile already registered");
        }
        User user = new User();
        user.setCustomerId("CIF" + (100000 + new Random().nextInt(900000)));
        user.setMobile(request.getMobile());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.CUSTOMER);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        redisTemplate.opsForValue().set("otp:" + request.getMobile(), otp, 5, TimeUnit.MINUTES);
        redisTemplate.delete(verifyAttemptKey(request.getMobile()));
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey(request.getMobile())))) {
            throw new BusinessException("OTP temporarily locked. Try again later");
        }
        String key = "otp:" + request.getMobile();
        String otp = redisTemplate.opsForValue().get(key);
        if (otp == null || !otp.equals(request.getOtp())) {
            long attempts = redisTemplate.opsForValue().increment(verifyAttemptKey(request.getMobile()));
            redisTemplate.expire(verifyAttemptKey(request.getMobile()), 10, TimeUnit.MINUTES);
            if (attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
                redisTemplate.opsForValue().set(lockKey(request.getMobile()), "1", OTP_LOCK_MINUTES, TimeUnit.MINUTES);
                throw new BusinessException("Max OTP attempts reached. Locked for 10 minutes");
            }
            throw new BusinessException("Invalid OTP");
        }
        redisTemplate.delete(key);
        redisTemplate.delete(verifyAttemptKey(request.getMobile()));
        User user = userRepository.findByMobile(request.getMobile()).orElseThrow(() -> new BusinessException("User not found"));
        return buildTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByMobile(request.getMobile()).orElseThrow(() -> new BusinessException("User not found"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Invalid credentials");
        }
        return buildTokens(user);
    }

    @Transactional
    public AuthResponse refresh(TokenRefreshRequest request) {
        String hash = sha256(request.getRefreshToken());
        RefreshToken token = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
            throw new BusinessException("Refresh token expired");
        }
        token.setRevoked(true);
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);
        User user = userRepository.findById(token.getUserId()).orElseThrow(() -> new BusinessException("User not found"));
        return buildTokens(user);
    }

    private AuthResponse buildTokens(User user) {
        String access = jwtService.generateAccessToken(user.getId().toString(), Map.of("role", user.getRole().name()));
        String refresh = jwtService.generateRefreshToken(user.getId().toString());
        refreshTokenRepository.revokeAllActiveTokensForUser(user.getId());

        RefreshToken entity = new RefreshToken();
        entity.setUserId(user.getId());
        entity.setTokenHash(sha256(refresh));
        entity.setRevoked(false);
        entity.setRevokedAt(null);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(entity);

        AuthResponse response = new AuthResponse();
        response.setAccessToken(access);
        response.setRefreshToken(refresh);
        response.setRole(user.getRole().name());
        response.setUserId(user.getId());
        return response;
    }

    private String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new BusinessException("Hashing failed");
        }
    }

    private void enforceOtpSendRateLimit(String mobile) {
        String rateKey = "otp:send:rate:" + mobile;
        Long count = redisTemplate.opsForValue().increment(rateKey);
        redisTemplate.expire(rateKey, 1, TimeUnit.MINUTES);
        if (count != null && count > MAX_OTP_SEND_PER_MINUTE) {
            throw new BusinessException("OTP request limit exceeded. Please retry in a minute");
        }
    }

    private String verifyAttemptKey(String mobile) {
        return "otp:verify:attempt:" + mobile;
    }

    private String lockKey(String mobile) {
        return "otp:verify:lock:" + mobile;
    }
}
