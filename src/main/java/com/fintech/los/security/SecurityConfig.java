package com.fintech.los.security;

import com.fintech.los.common.audit.AuditLoggingFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuditLoggingFilter auditLoggingFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, AuditLoggingFilter auditLoggingFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.auditLoggingFilter = auditLoggingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers(
                                "/api/v1/auth/send-otp",
                                "/api/v1/auth/verify-otp",
                                "/api/v1/auth/register-profile",
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/get-otp/**",
                                "/actuator/**"
                        ).permitAll()

                        // Logout & profile — must be authenticated (any valid role)
                        .requestMatchers(
                                "/api/v1/auth/logout",
                                "/api/v1/auth/me"
                        ).authenticated()

                        // Admin-level endpoints
                        .requestMatchers("/api/v1/admin/**")
                                .hasAnyRole("ADMIN", "UNDERWRITER", "LOAN_OFFICER", "RM", "CREDIT_ANALYST")

                        // Maker-checker: checker-only actions (approve/reject/return)
                        // These endpoints require Checker-tier roles, enforced both here AND in service layer
                        .requestMatchers(
                                "/api/v1/maker-checker/loans/*/approve",
                                "/api/v1/maker-checker/loans/*/reject",
                                "/api/v1/maker-checker/loans/*/return",
                                "/api/v1/maker-checker/dashboard/checker"
                        ).hasAnyRole("ADMIN", "BRANCH_MANAGER", "REGIONAL_CREDIT_MGR",
                                     "ZONAL_HEAD", "CREDIT_COMMITTEE", "BOD")

                        // Maker-checker: maker-only actions
                        .requestMatchers(
                                "/api/v1/maker-checker/loans",
                                "/api/v1/maker-checker/loans/*/allow-kyc",
                                "/api/v1/maker-checker/loans/*/update-permission",
                                "/api/v1/maker-checker/loans/*/recommend",
                                "/api/v1/maker-checker/loans/*/resubmit",
                                "/api/v1/maker-checker/dashboard/maker"
                        ).hasAnyRole("ADMIN", "LOAN_OFFICER", "RM", "CREDIT_ANALYST", "UNDERWRITER")

                        // Shared read-only maker-checker endpoints
                        .requestMatchers(
                                "/api/v1/maker-checker/checkers",
                                "/api/v1/maker-checker/loans/*/required-role",
                                "/api/v1/maker-checker/loans/*/audit"
                        ).hasAnyRole("ADMIN", "LOAN_OFFICER", "RM", "CREDIT_ANALYST", "UNDERWRITER",
                                     "BRANCH_MANAGER", "REGIONAL_CREDIT_MGR", "ZONAL_HEAD",
                                     "CREDIT_COMMITTEE", "BOD")

                        // All other authenticated endpoints
                        .anyRequest().authenticated()
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized. Please login.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.getWriter().write("{\"success\":false,\"message\":\"Access denied. You do not have permission to perform this action.\"}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(auditLoggingFilter, JwtAuthenticationFilter.class);
        return http.build();
    }
}
