package com.fintech.los.common.audit.model;

import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "loan_audit_logs")
public class LoanAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long applicationId;
    private Long actorId;

    @Enumerated(EnumType.STRING)
    private UserRole actorRole;

    private String action;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus newStatus;

    private String ipAddress;
    private String deviceId;
    private LocalDateTime timestamp;

    @Column(length = 64)
    private String previousHash;

    @Column(length = 64)
    private String currentHash;
}
