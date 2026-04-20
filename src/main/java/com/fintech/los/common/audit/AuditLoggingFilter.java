package com.fintech.los.common.audit;

import com.fintech.los.common.audit.model.AuditLog;
import com.fintech.los.common.audit.repository.AuditLogRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Component
public class AuditLoggingFilter extends OncePerRequestFilter {
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final AuditLogRepository auditLogRepository;

    public AuditLoggingFilter(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);
        if (!MUTATING_METHODS.contains(request.getMethod())) {
            return;
        }
        AuditLog log = new AuditLog();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.setActor(authentication != null ? String.valueOf(authentication.getPrincipal()) : "anonymous");
        log.setHttpMethod(request.getMethod());
        log.setPath(request.getRequestURI());
        log.setStatusCode(response.getStatus());
        log.setSuccess(response.getStatus() < 400);
        log.setRequestId(UUID.randomUUID().toString());
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }
}
