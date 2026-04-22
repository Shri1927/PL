package com.fintech.los.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey secretKey;
    private final String issuer;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtService(
            @Value("${app.security.issuer}") String issuer,
            @Value("${app.security.access-token-minutes}") long accessMinutes,
            @Value("${app.security.refresh-token-days}") long refreshDays,
            @Value("${app.security.jwt-secret:MySuperSecretKeyForJWTSigningThatIsAtLeast256BitsLong!!}") String secret) {
        this.issuer = issuer;
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String subject, Map<String, Object> claims) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(subject)
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessMinutes * 60)))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(refreshDays * 24 * 3600)))
                .signWith(secretKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
