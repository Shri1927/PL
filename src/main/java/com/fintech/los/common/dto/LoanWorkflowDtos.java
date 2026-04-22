package com.fintech.los.common.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

public final class LoanWorkflowDtos {
    private LoanWorkflowDtos() {
    }

    @Data
    public static class CreateApplicationRequest {
        @NotBlank
        private String loanPurpose;
        @NotNull
        @Positive
        private BigDecimal requestedAmount;
        @NotNull
        @Min(12)
        @Max(60)
        private Integer tenureMonths;
        @NotNull
        @Positive
        private BigDecimal monthlyIncome;
        @NotNull
        @Min(0)
        private BigDecimal existingEmi;
    }

    @Data
    public static class KycRequest {
        @NotBlank
        @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
        private String pan;
        @NotBlank
        @Pattern(regexp = "^[0-9]{4}$")
        private String aadhaarLast4;
    }

    @Data
    public static class CreditDecisionRequest {
        @NotNull
        @Min(300)
        @Max(900)
        private Integer bureauScore;
        @NotNull
        @Min(0)
        @Max(1000)
        private Integer internalScore;
    }

    @Data
    public static class OfferAcceptRequest {
        private boolean accepted;
    }

    @Data
    public static class DisbursementRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{9,18}$")
        private String bankAccount;
        @NotBlank
        @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$")
        private String ifsc;
    }

    @Data
    public static class EmiPaymentRequest {
        @NotNull
        @Positive
        private BigDecimal amount;
        @NotBlank
        private String gatewayRef;
    }

    @Data
    public static class DocumentUploadRequest {
        @NotBlank
        private String documentType;
        @NotBlank
        private String fileName;
        private String base64Content;
    }

    @Data
    public static class DocumentVerifyRequest {
        @NotNull
        private Long documentId;
        @NotBlank
        private String status; // VERIFIED or FAILED
        private String remarks;
    }
}
