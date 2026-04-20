package com.fintech.los.domain.loan;

public final class LoanEnums {
    private LoanEnums() {}

    public enum UserRole { CUSTOMER, ADMIN, UNDERWRITER }
    public enum EmploymentType { SALARIED, SELF_EMPLOYED }
    public enum ApplicationStatus { DRAFT, SUBMITTED, KYC_VERIFIED, DOCS_COMPLETE, APPROVED, REJECTED, ACCEPTED, AGREEMENT_EXECUTED, DISBURSED, ACTIVE, CLOSED }
    public enum VerificationStatus { PENDING, VERIFIED, FAILED, MANUAL_REVIEW }
    public enum RiskGrade { A, B, C, D, E }
    public enum Decision { APPROVED, APPROVED_WITH_CONDITIONS, REJECTED, QUERY_RAISED }
    public enum DisbursementStatus { PENDING, SUCCESS, FAILED }
    public enum TransactionType { DISBURSEMENT, EMI_PAYMENT, PREPAYMENT, FEE, REFUND }
}
