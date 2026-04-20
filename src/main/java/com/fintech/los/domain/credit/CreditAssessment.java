package com.fintech.los.domain.credit;

import com.fintech.los.domain.loan.LoanEnums.Decision;
import com.fintech.los.domain.loan.LoanEnums.RiskGrade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "credit_assessments")
public class CreditAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private Integer bureauScore;
    private Integer internalScore;
    @Enumerated(EnumType.STRING)
    private RiskGrade riskGrade;
    private boolean policyPassed;
    private boolean stpEligible;
    @Enumerated(EnumType.STRING)
    private Decision finalDecision;
    private String decisionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
