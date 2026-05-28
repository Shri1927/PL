package com.fintech.los.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter — Cookie & Header Extraction Tests")
class JwtAuthenticationFilterTest {

    @Mock JwtService jwtService;
    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock FilterChain filterChain;

    @InjectMocks
    JwtAuthenticationFilter filter;

    // -------------------------------------------------------------------------
    // Test 1: JWT is extracted from HttpOnly cookie
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("✅ Token is extracted from access_token HttpOnly cookie")
    void token_extractedFromCookie() throws Exception {
        Cookie accessCookie = new Cookie("access_token", "cookie.jwt.token");
        when(request.getCookies()).thenReturn(new Cookie[]{ accessCookie });

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("42");
        when(claims.get("role")).thenReturn("CUSTOMER");
        when(jwtService.parse("cookie.jwt.token")).thenReturn(claims);

        filter.doFilterInternal(request, response, filterChain);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("42");
        assertThat(auth.getAuthorities()).anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));

        // Chain must always continue
        verify(filterChain).doFilter(request, response);
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // Test 2: JWT falls back to Authorization header when no cookie
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("✅ Token is extracted from Authorization header when no cookie")
    void token_extractedFromHeader_whenNoCookie() throws Exception {
        when(request.getCookies()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer header.jwt.token");

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("7");
        when(claims.get("role")).thenReturn("LOAN_OFFICER");
        when(jwtService.parse("header.jwt.token")).thenReturn(claims);

        filter.doFilterInternal(request, response, filterChain);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("7");
        assertThat(auth.getAuthorities()).anyMatch(a -> a.getAuthority().equals("ROLE_LOAN_OFFICER"));

        verify(filterChain).doFilter(request, response);
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // Test 3: Cookie takes priority over header
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("✅ Cookie token takes priority over Authorization header")
    void cookie_takesPriorityOverHeader() throws Exception {
        Cookie accessCookie = new Cookie("access_token", "cookie.jwt.token");
        when(request.getCookies()).thenReturn(new Cookie[]{ accessCookie });
        // Header is also present but should NOT be used
        when(request.getHeader("Authorization")).thenReturn("Bearer header.jwt.token");

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("1");
        when(claims.get("role")).thenReturn("ADMIN");
        // Only the cookie token should be parsed
        when(jwtService.parse("cookie.jwt.token")).thenReturn(claims);

        filter.doFilterInternal(request, response, filterChain);

        // cookie token was used — header token parse was never called
        verify(jwtService, never()).parse("header.jwt.token");
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // Test 4: Invalid token clears security context and continues filter chain
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("⚠️ Invalid token clears SecurityContext and continues chain (no 401 thrown)")
    void invalidToken_clearsContext_continuesChain() throws Exception {
        Cookie accessCookie = new Cookie("access_token", "bad.token.here");
        when(request.getCookies()).thenReturn(new Cookie[]{ accessCookie });
        when(jwtService.parse(anyString())).thenThrow(new RuntimeException("invalid jwt"));

        filter.doFilterInternal(request, response, filterChain);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
        // Chain must still continue so Spring Security can return 401 properly
        verify(filterChain).doFilter(request, response);
    }

    // -------------------------------------------------------------------------
    // Test 5: No token (no cookie, no header) — request passes through unauthenticated
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("✅ No token = request passes through unauthenticated (public endpoints work)")
    void noToken_requestPassesThrough() throws Exception {
        when(request.getCookies()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        // Filter chain continues — Spring Security handles the 401 for protected routes
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).parse(anyString());
    }
}
