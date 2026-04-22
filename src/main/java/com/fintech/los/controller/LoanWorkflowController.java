package com.fintech.los.controller;

import com.fintech.los.common.dto.LoanWorkflowDtos.*;
import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.domain.agreement.LoanAgreement;
import com.fintech.los.domain.credit.CreditAssessment;
import com.fintech.los.domain.disbursement.Disbursement;
import com.fintech.los.domain.document.LoanDocument;
import com.fintech.los.domain.kyc.KycDetails;
import com.fintech.los.domain.lms.LoanTransaction;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.offer.LoanOffer;
import com.fintech.los.service.LoanWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class LoanWorkflowController {
    private final LoanWorkflowService service;

    @GetMapping("/applications")
    public Page<LoanApplication> listApplications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = Long.parseLong(authentication.getName());
        return service.getUserApplications(userId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @GetMapping("/applications/stats")
    public Map<String, Object> getStats(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return service.getUserStats(userId);
    }

    @GetMapping("/applications/{id}")
    public ApiResponse<LoanApplication> getApplication(@PathVariable Long id) {
        return ok(service.getApplicationById(id), "Application details");
    }

    // Full application details with all stage data
    @GetMapping("/applications/{id}/details")
    public ApiResponse<Map<String, Object>> getFullDetails(@PathVariable Long id) {
        return ok(service.getFullApplicationDetails(id), "Full application details");
    }

    @PostMapping("/applications")
    public ApiResponse<LoanApplication> create(Authentication authentication, @Valid @RequestBody CreateApplicationRequest req) {
        Long userId = Long.parseLong(authentication.getName());
        return ok(service.createApplication(userId, req), "Application created in DRAFT state");
    }

    // Stage 03 — KYC Verification
    @PostMapping("/applications/{id}/kyc")
    public ApiResponse<KycDetails> kyc(@PathVariable Long id, @Valid @RequestBody KycRequest req) {
        return ok(service.runKyc(id, req), "KYC verified");
    }

    @GetMapping("/applications/{id}/kyc")
    public ApiResponse<KycDetails> getKyc(@PathVariable Long id) {
        return ok(service.getKycDetails(id), "KYC details");
    }

    // Stage 04 — Document Upload & Verification
    @PostMapping("/applications/{id}/documents")
    public ApiResponse<LoanDocument> uploadDocument(@PathVariable Long id, @Valid @RequestBody DocumentUploadRequest req) {
        return ok(service.uploadDocument(id, req), "Document uploaded");
    }

    @GetMapping("/applications/{id}/documents")
    public ApiResponse<List<LoanDocument>> getDocuments(@PathVariable Long id) {
        return ok(service.getDocuments(id), "Documents list");
    }

    @PostMapping("/applications/{id}/documents/verify")
    public ApiResponse<LoanDocument> verifyDocument(@PathVariable Long id, @Valid @RequestBody DocumentVerifyRequest req) {
        return ok(service.verifyDocument(id, req), "Document verified");
    }

    @PostMapping("/applications/{id}/documents/auto-verify")
    public ApiResponse<List<LoanDocument>> autoVerifyDocuments(@PathVariable Long id) {
        return ok(service.autoVerifyDocuments(id), "All documents auto-verified");
    }

    // Stage 05 — Credit Assessment
    @PostMapping("/applications/{id}/credit")
    public ApiResponse<CreditAssessment> credit(@PathVariable Long id, @Valid @RequestBody CreditDecisionRequest req) {
        return ok(service.assessCredit(id, req), "Credit decision completed");
    }

    @GetMapping("/applications/{id}/credit")
    public ApiResponse<CreditAssessment> getCredit(@PathVariable Long id) {
        return ok(service.getCreditAssessment(id), "Credit assessment details");
    }

    // Stage 06 — Offer Generation
    @PostMapping("/applications/{id}/offer")
    public ApiResponse<LoanOffer> offer(@PathVariable Long id) {
        return ok(service.generateOffer(id), "Loan offer generated");
    }

    @GetMapping("/applications/{id}/offer")
    public ApiResponse<LoanOffer> getOffer(@PathVariable Long id) {
        return ok(service.getOffer(id), "Offer details");
    }

    // Stage 07 — Offer Acceptance
    @PostMapping("/applications/{id}/offer/accept")
    public ApiResponse<LoanOffer> offerAccept(@PathVariable Long id, @Valid @RequestBody OfferAcceptRequest request) {
        return ok(service.acceptOffer(id, request), "Offer decision captured");
    }

    // Stage 08 — Legal Agreement
    @PostMapping("/applications/{id}/agreement")
    public ApiResponse<LoanAgreement> agreement(@PathVariable Long id) {
        return ok(service.executeAgreement(id), "Agreement executed");
    }

    @GetMapping("/applications/{id}/agreement")
    public ApiResponse<LoanAgreement> getAgreement(@PathVariable Long id) {
        return ok(service.getAgreement(id), "Agreement details");
    }

    // Stage 09 — Disbursement
    @PostMapping("/applications/{id}/disbursement")
    public ApiResponse<Disbursement> disburse(@PathVariable Long id, @Valid @RequestBody DisbursementRequest req) {
        return ok(service.disburse(id, req), "Disbursement successful");
    }

    @GetMapping("/applications/{id}/disbursement")
    public ApiResponse<Disbursement> getDisbursement(@PathVariable Long id) {
        return ok(service.getDisbursement(id), "Disbursement details");
    }

    // Stage 10 — EMI Payment
    @PostMapping("/applications/{id}/emi/pay")
    public ApiResponse<LoanTransaction> emiPay(@PathVariable Long id, @Valid @RequestBody EmiPaymentRequest req) {
        return ok(service.payEmi(id, req), "EMI payment captured");
    }

    private <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().timestamp(Instant.now()).success(true).message(message).data(data).build();
    }
}
