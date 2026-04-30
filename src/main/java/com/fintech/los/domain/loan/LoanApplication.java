package com.fintech.los.domain.loan;

import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    @Enumerated(EnumType.STRING)
    private Tier tier;
    private Long createdBy;
    private Long currentAssignedTo;
    private LocalDateTime slaDeadline;
    private String loanPurpose;
    private BigDecimal requestedAmount;
    private BigDecimal sanctionedAmount;
    private Integer tenureMonths;
    private BigDecimal annualInterestRate;
    private BigDecimal monthlyIncome;
    private BigDecimal existingEmi;
    private BigDecimal dtiRatio;
    private String stage;
    private Integer allowedStage; // New field to control workflow permission
    
    // Personal Details
    private String fatherName;
    private String motherName;
    private String gender;
    private String maritalStatus;
    private Integer dependents;
    private String currentAddress;
    private String permanentAddress;
    private String residentialStability;

    // Employment Details
    private String companyName;
    private String employeeId;
    private String designation;
    private Integer currentExperienceMonths;
    private Integer totalExperienceMonths;
    private String officeAddress;
    private String officialEmail;

    // Financial Details
    private BigDecimal grossMonthlyIncome;
    private BigDecimal netTakeHomeSalary; // Maps to or replaces monthlyIncome logic
    private BigDecimal otherIncome;
    private Integer existingLoansCount;
    private BigDecimal creditCardOutstanding;

    // Bank Details
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountType;
    private String bankIfsc;

    private String mandateStatus; // PENDING, REGISTERED
    private BigDecimal outstandingPrincipal;
    private LocalDate nextEmiDueDate;

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
