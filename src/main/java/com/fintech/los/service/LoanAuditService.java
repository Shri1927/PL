package com.fintech.los.service;

import com.fintech.los.common.audit.model.LoanAuditLog;
import com.fintech.los.common.audit.repository.LoanAuditLogRepository;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.LoanApplication;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoanAuditService {

    private final LoanAuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(LoanApplication application, User actor, String action) {
        LoanAuditLog log = new LoanAuditLog();
        log.setApplicationId(application.getId());
        log.setActorId(actor.getId());
        log.setActorRole(actor.getRole());
        log.setAction(action);
        log.setPreviousStatus(application.getStatus());
        log.setNewStatus(application.getStatus());
        log.setTimestamp(LocalDateTime.now());
        
        logManualAction(log);
    }

    @Transactional
    public void logManualAction(LoanAuditLog log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(LocalDateTime.now());
        }
        
        // Find previous log for hash chaining
        Optional<LoanAuditLog> lastLog = auditLogRepository.findFirstByApplicationIdOrderByIdDesc(log.getApplicationId());
        String prevHash = lastLog.map(LoanAuditLog::getCurrentHash).orElse("0".repeat(44)); // SHA-256 Base64 is 44 chars
        log.setPreviousHash(prevHash);
        
        log.setCurrentHash(calculateHash(log));
        auditLogRepository.save(log);
    }

    private String calculateHash(LoanAuditLog log) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            // Use String.valueOf() to avoid NullPointerException in String.format with %d
            String data = String.format("%s|%s|%s|%s|%s",
                    String.valueOf(log.getApplicationId()),
                    String.valueOf(log.getActorId()),
                    log.getAction() != null ? log.getAction() : "NONE",
                    log.getPreviousHash() != null ? log.getPreviousHash() : "0".repeat(44),
                    log.getTimestamp() != null ? log.getTimestamp().toString() : LocalDateTime.now().toString());
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
