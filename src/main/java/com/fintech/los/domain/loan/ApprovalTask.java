package com.fintech.los.domain.loan;

import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "approval_tasks")
public class ApprovalTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long applicationId;

    @Enumerated(EnumType.STRING)
    private Tier tier;

    private Integer level; // for dual-checker in Tier 3

    private Long assignedTo;

    @Enumerated(EnumType.STRING)
    private UserRole assignedRole;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private LocalDateTime actionedAt;
    private LocalDateTime createdAt;
}
