package com.fintech.los.controller;

import com.fintech.los.common.dto.LoanWorkflowDtos.*;
import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.domain.agreement.LoanAgreement;
import com.fintech.los.domain.credit.CreditAssessment;
import com.fintech.los.domain.disbursement.Disbursement;
import com.fintech.los.domain.kyc.KycDetails;
import com.fintech.los.domain.lms.LoanTransaction;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.offer.LoanOffer;
import com.fintech.los.service.LoanWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class LoanWorkflowController {
    private final LoanWorkflowService service;

    @PostMapping("/applications")
    public ApiResponse<LoanApplication> create(@RequestParam Long userId, @Valid @RequestBody CreateApplicationRequest req) {
        return ok(service.createApplication(userId, req), "Application created in DRAFT state");
    }

    @PostMapping("/applications/{id}/kyc")
    public ApiResponse<KycDetails> kyc(@PathVariable Long id, @Valid @RequestBody KycRequest req) {
        return ok(service.runKyc(id, req), "KYC verified");
    }

    @PostMapping("/applications/{id}/credit")
    public ApiResponse<CreditAssessment> credit(@PathVariable Long id, @Valid @RequestBody CreditDecisionRequest req) {
        return ok(service.assessCredit(id, req), "Credit decision completed");
    }

    @PostMapping("/applications/{id}/offer")
    public ApiResponse<LoanOffer> offer(@PathVariable Long id) {
        return ok(service.generateOffer(id), "Loan offer generated");
    }

    @PostMapping("/applications/{id}/offer/accept")
    public ApiResponse<LoanOffer> offerAccept(@PathVariable Long id, @Valid @RequestBody OfferAcceptRequest request) {
        return ok(service.acceptOffer(id, request), "Offer decision captured");
    }

    @PostMapping("/applications/{id}/agreement")
    public ApiResponse<LoanAgreement> agreement(@PathVariable Long id) {
        return ok(service.executeAgreement(id), "Agreement executed");
    }

    @PostMapping("/applications/{id}/disbursement")
    public ApiResponse<Disbursement> disburse(@PathVariable Long id, @Valid @RequestBody DisbursementRequest req) {
        return ok(service.disburse(id, req), "Disbursement successful");
    }

    @PostMapping("/applications/{id}/emi/pay")
    public ApiResponse<LoanTransaction> emiPay(@PathVariable Long id, @Valid @RequestBody EmiPaymentRequest req) {
        return ok(service.payEmi(id, req), "EMI payment captured");
    }

    private <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().timestamp(Instant.now()).success(true).message(message).data(data).build();
    }
}
