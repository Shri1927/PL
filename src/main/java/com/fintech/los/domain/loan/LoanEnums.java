package com.fintech.los.domain.loan;

public final class LoanEnums {
    private LoanEnums() {}

    public enum UserRole { 
        CUSTOMER, ADMIN, UNDERWRITER, 
        LOAN_OFFICER, RM, BRANCH_MANAGER, 
        REGIONAL_CREDIT_MGR, ZONAL_HEAD, 
        CREDIT_ANALYST, CREDIT_COMMITTEE, BOD 
    }
    public enum EmploymentType { SALARIED, SELF_EMPLOYED }
    public enum ApplicationStatus { 
        DRAFT, SUBMITTED, MAKER_CHECKED, UNDER_REVIEW, APPROVED, REJECTED, RETURNED,
        KYC_VERIFIED, DOCS_COMPLETE, ACCEPTED, AGREEMENT_EXECUTED, DISBURSED, ACTIVE, CLOSED 
    }
    public enum Tier { TIER_1, TIER_2, TIER_3, TIER_4 }
    public enum TaskStatus { PENDING, APPROVED, REJECTED, RETURNED }
    public enum VerificationStatus { PENDING, VERIFIED, FAILED, MANUAL_REVIEW }
    public enum RiskGrade { A, B, C, D, E }
    public enum Decision { APPROVED, APPROVED_WITH_CONDITIONS, REJECTED, QUERY_RAISED }
    public enum DisbursementStatus { PENDING, SUCCESS, FAILED }
    public enum TransactionType { DISBURSEMENT, EMI_PAYMENT, PREPAYMENT, FEE, REFUND }
}
