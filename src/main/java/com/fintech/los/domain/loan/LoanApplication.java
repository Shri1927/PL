package com.fintech.los.domain.loan;

import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "loan_applications")
public class LoanApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String applicationRef;
    private Long userId;
    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;
    private String loanPurpose;
    private BigDecimal requestedAmount;
    private BigDecimal sanctionedAmount;
    private Integer tenureMonths;
    private BigDecimal annualInterestRate;
    private BigDecimal monthlyIncome;
    private BigDecimal existingEmi;
    private BigDecimal dtiRatio;
    private String stage;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
