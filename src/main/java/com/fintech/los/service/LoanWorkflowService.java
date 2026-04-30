package com.fintech.los.service;

import com.fintech.los.common.dto.LoanWorkflowDtos.*;
import com.fintech.los.common.exception.BusinessException;
import com.fintech.los.domain.agreement.LoanAgreement;
import com.fintech.los.domain.agreement.repository.LoanAgreementRepository;
import com.fintech.los.domain.credit.CreditAssessment;
import com.fintech.los.domain.credit.repository.CreditAssessmentRepository;
import com.fintech.los.domain.disbursement.Disbursement;
import com.fintech.los.domain.disbursement.repository.DisbursementRepository;
import com.fintech.los.domain.document.LoanDocument;
import com.fintech.los.domain.document.repository.LoanDocumentRepository;
import com.fintech.los.domain.kyc.KycDetails;
import com.fintech.los.domain.kyc.repository.KycDetailsRepository;
import com.fintech.los.domain.lms.EmiSchedule;
import com.fintech.los.domain.lms.LoanTransaction;
import com.fintech.los.domain.lms.repository.EmiScheduleRepository;
import com.fintech.los.domain.lms.repository.LoanTransactionRepository;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.*;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import com.fintech.los.domain.offer.LoanOffer;
import com.fintech.los.domain.offer.repository.LoanOfferRepository;
import com.fintech.los.integration.notification.WorkflowEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
public class LoanWorkflowService {
    private final LoanApplicationRepository loanApplicationRepository;
    private final KycDetailsRepository kycDetailsRepository;
    private final CreditAssessmentRepository creditAssessmentRepository;
    private final LoanOfferRepository loanOfferRepository;
    private final LoanAgreementRepository loanAgreementRepository;
    private final DisbursementRepository disbursementRepository;
    private final LoanDocumentRepository loanDocumentRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final LoanTransactionRepository loanTransactionRepository;
    private final WorkflowEventPublisher eventPublisher;

    @Transactional
    public LoanApplication createApplication(Long userId, CreateApplicationRequest req) {
        LoanApplication a = new LoanApplication();
        a.setApplicationRef("REF" + (100000 + new Random().nextInt(900000)));
        a.setUserId(userId);
        a.setStatus(ApplicationStatus.DRAFT);
        a.setStage("STAGE_02");
        a.setAllowedStage(1);
        a.setLoanPurpose(req.getLoanPurpose());
        a.setRequestedAmount(req.getRequestedAmount());
        a.setTenureMonths(req.getTenureMonths());
        a.setMonthlyIncome(req.getMonthlyIncome());
        a.setExistingEmi(req.getExistingEmi());
        a.setDtiRatio(calcDti(req.getExistingEmi(), req.getRequestedAmount(), req.getTenureMonths(), req.getMonthlyIncome()));
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        LoanApplication saved = loanApplicationRepository.save(a);
        eventPublisher.publish("APPLICATION_CREATED", saved.getId(), saved.getApplicationRef());
        return saved;
    }

    @Transactional
    public LoanApplication updateApplicationDraft(Long applicationId, UpdateApplicationRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("Only DRAFT applications can be updated");
        }

        if (req.getLoanPurpose() != null) app.setLoanPurpose(req.getLoanPurpose());
        if (req.getRequestedAmount() != null) app.setRequestedAmount(req.getRequestedAmount());
        if (req.getTenureMonths() != null) app.setTenureMonths(req.getTenureMonths());
        
        if (req.getFatherName() != null) app.setFatherName(req.getFatherName());
        if (req.getMotherName() != null) app.setMotherName(req.getMotherName());
        if (req.getGender() != null) app.setGender(req.getGender());
        if (req.getMaritalStatus() != null) app.setMaritalStatus(req.getMaritalStatus());
        if (req.getDependents() != null) app.setDependents(req.getDependents());
        if (req.getCurrentAddress() != null) app.setCurrentAddress(req.getCurrentAddress());
        if (req.getPermanentAddress() != null) app.setPermanentAddress(req.getPermanentAddress());
        if (req.getResidentialStability() != null) app.setResidentialStability(req.getResidentialStability());

        if (req.getCompanyName() != null) app.setCompanyName(req.getCompanyName());
        if (req.getEmployeeId() != null) app.setEmployeeId(req.getEmployeeId());
        if (req.getDesignation() != null) app.setDesignation(req.getDesignation());
        if (req.getCurrentExperienceMonths() != null) app.setCurrentExperienceMonths(req.getCurrentExperienceMonths());
        if (req.getTotalExperienceMonths() != null) app.setTotalExperienceMonths(req.getTotalExperienceMonths());
        if (req.getOfficeAddress() != null) app.setOfficeAddress(req.getOfficeAddress());
        if (req.getOfficialEmail() != null) app.setOfficialEmail(req.getOfficialEmail());

        if (req.getGrossMonthlyIncome() != null) app.setGrossMonthlyIncome(req.getGrossMonthlyIncome());
        if (req.getNetTakeHomeSalary() != null) {
            app.setNetTakeHomeSalary(req.getNetTakeHomeSalary());
            app.setMonthlyIncome(req.getNetTakeHomeSalary());
        }
        if (req.getOtherIncome() != null) app.setOtherIncome(req.getOtherIncome());
        if (req.getExistingEmi() != null) app.setExistingEmi(req.getExistingEmi());
        if (req.getExistingLoansCount() != null) app.setExistingLoansCount(req.getExistingLoansCount());
        if (req.getCreditCardOutstanding() != null) app.setCreditCardOutstanding(req.getCreditCardOutstanding());

        if (req.getBankName() != null) app.setBankName(req.getBankName());
        if (req.getBankAccountNumber() != null) app.setBankAccountNumber(req.getBankAccountNumber());
        if (req.getBankAccountType() != null) app.setBankAccountType(req.getBankAccountType());
        if (req.getBankIfsc() != null) app.setBankIfsc(req.getBankIfsc());

        app.setDtiRatio(calcDti(app.getExistingEmi(), app.getRequestedAmount(), app.getTenureMonths(), app.getMonthlyIncome()));
        app.setUpdatedAt(LocalDateTime.now());
        
        return loanApplicationRepository.save(app);
    }

    @Transactional
    public LoanApplication submitApplication(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("Only DRAFT applications can be submitted");
        }
        
        app.setStatus(ApplicationStatus.SUBMITTED);
        app.setAllowedStage(2); // Maker Review stage
        app.setSubmittedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication saved = loanApplicationRepository.save(app);
        eventPublisher.publish("APPLICATION_SUBMITTED", saved.getId(), saved.getApplicationRef());
        return saved;
    }

    @Transactional
    public KycDetails runKyc(Long applicationId, KycRequest req) {
        LoanApplication app = getApplication(applicationId);
        KycDetails k = kycDetailsRepository.findByApplicationId(applicationId).orElse(new KycDetails());
        k.setApplicationId(applicationId);
        k.setPan(req.getPan());
        k.setAadhaarToken("AADHAAR-TOKEN-" + req.getAadhaarLast4());
        k.setPanVerified(req.getPan() != null && req.getPan().length() == 10);
        k.setAadhaarVerified(true);
        k.setCkycFound(new Random().nextBoolean());
        k.setVideoKycRequired(app.getRequestedAmount() != null && app.getRequestedAmount().compareTo(new BigDecimal("200000")) > 0);
        k.setFraudFlag(false);
        k.setAmlFlag(false);
        k.setStatus(VerificationStatus.VERIFIED);
        k.setCreatedAt(LocalDateTime.now());
        k.setUpdatedAt(LocalDateTime.now());

        app.setStatus(ApplicationStatus.KYC_VERIFIED);
        app.setAllowedStage(4); // Move to Documents
        app.setStage("STAGE_03");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        KycDetails saved = kycDetailsRepository.save(k);
        eventPublisher.publish("KYC_VERIFIED", applicationId, saved.getStatus().name());
        return saved;
    }

    // ── Stage 04: Document Upload & Verification ──

    @Transactional
    public LoanDocument uploadDocument(Long applicationId, DocumentUploadRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.KYC_VERIFIED && app.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("Documents can only be uploaded for DRAFT or KYC_VERIFIED applications");
        }
        LoanDocument doc = new LoanDocument();
        doc.setApplicationId(applicationId);
        doc.setDocumentType(req.getDocumentType());
        doc.setStorageUrl("/documents/" + applicationId + "/" + req.getFileName());
        doc.setVerificationStatus(VerificationStatus.PENDING);
        doc.setOcrPayload("{\"extracted\": true, \"confidence\": 0.95, \"documentType\": \"" + req.getDocumentType() + "\", \"fileName\": \"" + req.getFileName() + "\"}");
        doc.setQualityScore(new BigDecimal("0." + (80 + new Random().nextInt(20))));
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        LoanDocument saved = loanDocumentRepository.save(doc);
        eventPublisher.publish("DOCUMENT_UPLOADED", applicationId, req.getDocumentType());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<LoanDocument> getDocuments(Long applicationId) {
        getApplication(applicationId); // ensure exists
        return loanDocumentRepository.findByApplicationId(applicationId);
    }

    @Transactional
    public LoanDocument verifyDocument(Long applicationId, DocumentVerifyRequest req) {
        LoanDocument doc = loanDocumentRepository.findById(req.getDocumentId())
                .orElseThrow(() -> new BusinessException("Document not found"));
        if (!doc.getApplicationId().equals(applicationId)) {
            throw new BusinessException("Document does not belong to this application");
        }
        doc.setVerificationStatus("VERIFIED".equals(req.getStatus()) ? VerificationStatus.VERIFIED : VerificationStatus.FAILED);
        doc.setUpdatedAt(LocalDateTime.now());
        LoanDocument saved = loanDocumentRepository.save(doc);

        // Auto-set DOCS_COMPLETE if all docs are verified
        List<LoanDocument> allDocs = loanDocumentRepository.findByApplicationId(applicationId);
        boolean allVerified = allDocs.stream().allMatch(d -> d.getVerificationStatus() == VerificationStatus.VERIFIED);
        if (allVerified && !allDocs.isEmpty()) {
            LoanApplication app = getApplication(applicationId);
            app.setStatus(ApplicationStatus.DOCS_COMPLETE);
            app.setAllowedStage(5); // Move to Credit
            app.setStage("STAGE_04");
            app.setUpdatedAt(LocalDateTime.now());
            loanApplicationRepository.save(app);
            eventPublisher.publish("DOCS_COMPLETE", applicationId, "All documents verified");
        }
        return saved;
    }

    @Transactional
    public List<LoanDocument> autoVerifyDocuments(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        List<LoanDocument> docs = loanDocumentRepository.findByApplicationId(applicationId);
        if (docs.isEmpty()) {
            throw new BusinessException("No documents uploaded to verify");
        }
        for (LoanDocument doc : docs) {
            doc.setVerificationStatus(VerificationStatus.VERIFIED);
            doc.setQualityScore(new BigDecimal("0." + (85 + new Random().nextInt(15))));
            doc.setUpdatedAt(LocalDateTime.now());
            loanDocumentRepository.save(doc);
        }
        app.setStatus(ApplicationStatus.DOCS_COMPLETE);
        app.setAllowedStage(5); // Move to Credit
        app.setStage("STAGE_04");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        eventPublisher.publish("DOCS_COMPLETE", applicationId, "Auto-verified " + docs.size() + " documents");
        return docs;
    }

    @Transactional
    public CreditAssessment assessCredit(Long applicationId, CreditDecisionRequest req) {
        LoanApplication app = getApplication(applicationId);
        // Allow credit assessment from KYC_VERIFIED or DOCS_COMPLETE
        if (app.getStatus() != ApplicationStatus.KYC_VERIFIED && app.getStatus() != ApplicationStatus.DOCS_COMPLETE) {
            throw new BusinessException("Credit assessment requires KYC verification or document completion");
        }
        CreditAssessment c = creditAssessmentRepository.findByApplicationId(applicationId).orElse(new CreditAssessment());
        c.setApplicationId(applicationId);
        c.setBureauScore(req.getBureauScore());
        c.setInternalScore(req.getInternalScore());
        c.setPolicyPassed(req.getBureauScore() >= 650);
        c.setRiskGrade(riskGrade(req.getBureauScore()));
        c.setStpEligible(req.getBureauScore() >= 750 && app.getDtiRatio().compareTo(new BigDecimal("0.50")) <= 0);
        c.setFinalDecision(c.isPolicyPassed() ? Decision.APPROVED : Decision.REJECTED);
        c.setDecisionReason(c.isPolicyPassed() ? "Score and policy checks passed" : "Bureau score below policy threshold");
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());

        app.setStatus(c.getFinalDecision() == Decision.APPROVED ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED);
        app.setAllowedStage(6); // Move to Offer
        app.setStage("STAGE_05");
        if (c.getFinalDecision() == Decision.APPROVED) {
            app.setSanctionedAmount(app.getRequestedAmount());
            app.setAnnualInterestRate(rateForGrade(c.getRiskGrade()));
        }
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        CreditAssessment saved = creditAssessmentRepository.save(c);
        eventPublisher.publish("CREDIT_DECISION", applicationId, saved.getFinalDecision().name());
        return saved;
    }

    @Transactional
    public LoanOffer generateOffer(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.APPROVED) {
            throw new BusinessException("Offer generation requires approved application — current status: " + app.getStatus());
        }
        LoanOffer o = loanOfferRepository.findByApplicationId(applicationId).orElse(new LoanOffer());
        o.setApplicationId(applicationId);
        o.setValidTill(LocalDateTime.now().plusDays(30));
        o.setProcessingFee(app.getSanctionedAmount().multiply(new BigDecimal("0.02")).setScale(2, RoundingMode.HALF_UP));
        o.setInsurancePremium(BigDecimal.ZERO);
        o.setApr(app.getAnnualInterestRate().add(new BigDecimal("0.75")));
        o.setCreatedAt(LocalDateTime.now());
        o.setUpdatedAt(LocalDateTime.now());

        app.setStatus(ApplicationStatus.APPROVED);
        app.setAllowedStage(7); // Move to Acceptance
        app.setStage("STAGE_06");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);

        LoanOffer saved = loanOfferRepository.save(o);
        eventPublisher.publish("LOAN_OFFER_GENERATED", applicationId, saved.getApr().toPlainString());
        return saved;
    }

    @Transactional
    public LoanOffer acceptOffer(Long applicationId, OfferAcceptRequest request) {
        LoanOffer offer = loanOfferRepository.findByApplicationId(applicationId).orElseThrow(() -> new BusinessException("Offer not found"));
        offer.setAccepted(request.isAccepted());
        offer.setAcceptedAt(LocalDateTime.now());
        offer.setUpdatedAt(LocalDateTime.now());
        LoanApplication app = getApplication(applicationId);
        app.setStatus(request.isAccepted() ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED);
        app.setAllowedStage(request.isAccepted() ? 8 : app.getAllowedStage()); // Move to Agreement if accepted
        app.setStage("STAGE_07");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        LoanOffer saved = loanOfferRepository.save(offer);
        eventPublisher.publish("LOAN_OFFER_DECIDED", applicationId, request.isAccepted() ? "ACCEPTED" : "REJECTED");
        return saved;
    }

    @Transactional
    public LoanAgreement executeAgreement(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new BusinessException("Agreement execution requires accepted offer");
        }
        LoanAgreement a = loanAgreementRepository.findByApplicationId(applicationId).orElse(new LoanAgreement());
        a.setApplicationId(applicationId);
        a.setAgreementHash("SHA256-" + applicationId + "-" + System.currentTimeMillis());
        a.setSigned(true);
        a.setSignedAt(LocalDateTime.now());
        a.setSignedDocumentUrl("/agreements/" + applicationId + ".pdf");
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());

        app.setStatus(ApplicationStatus.AGREEMENT_EXECUTED);
        app.setAllowedStage(9); // Move to Disbursement
        app.setStage("STAGE_08");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        LoanAgreement saved = loanAgreementRepository.save(a);
        eventPublisher.publish("AGREEMENT_EXECUTED", applicationId, saved.getAgreementHash());
        return saved;
    }

    @Transactional
    public Disbursement disburse(Long applicationId, DisbursementRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.AGREEMENT_EXECUTED) {
            throw new BusinessException("Disbursement requires executed agreement");
        }
        LoanOffer offer = loanOfferRepository.findByApplicationId(applicationId).orElseThrow(() -> new BusinessException("Offer missing"));
        Disbursement d = disbursementRepository.findByApplicationId(applicationId).orElse(new Disbursement());
        d.setApplicationId(applicationId);
        d.setBankAccount(req.getBankAccount());
        d.setIfsc(req.getIfsc());
        d.setStatus(DisbursementStatus.SUCCESS);
        d.setUtr("UTR" + System.currentTimeMillis());
        d.setAmount(app.getSanctionedAmount().subtract(offer.getProcessingFee()).subtract(offer.getInsurancePremium()));
        d.setDisbursedAt(LocalDateTime.now());
        d.setCreatedAt(LocalDateTime.now());
        d.setUpdatedAt(LocalDateTime.now());

        app.setStatus(ApplicationStatus.DISBURSED);
        app.setAllowedStage(10); // Move to Active/Mandate
        app.setStage("STAGE_09");
        app.setOutstandingPrincipal(app.getSanctionedAmount());
        app.setMandateStatus("PENDING");
        app.setNextEmiDueDate(LocalDate.now().plusMonths(1));
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        buildSchedule(app);
        Disbursement saved = disbursementRepository.save(d);
        eventPublisher.publish("DISBURSEMENT_SUCCESS", applicationId, saved.getUtr());
        return saved;
    }

    @Transactional
    public LoanApplication registerMandate(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.DISBURSED && app.getStatus() != ApplicationStatus.ACTIVE) {
            throw new BusinessException("Mandate registration requires disbursed loan");
        }
        app.setMandateStatus("REGISTERED");
        app.setStatus(ApplicationStatus.ACTIVE);
        app.setAllowedStage(10);
        app.setStage("STAGE_10");
        app.setUpdatedAt(LocalDateTime.now());
        LoanApplication saved = loanApplicationRepository.save(app);
        eventPublisher.publish("MANDATE_REGISTERED", applicationId, "SUCCESS");
        return saved;
    }

    @Transactional
    public LoanTransaction simulateEmiCollection(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getMandateStatus() == null || !app.getMandateStatus().equals("REGISTERED")) {
            throw new BusinessException("NACH Mandate not registered");
        }

        List<EmiSchedule> items = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId);
        EmiSchedule nextEmi = items.stream().filter(i -> !i.isPaid()).findFirst()
                .orElseThrow(() -> new BusinessException("No pending EMIs found"));

        // Simulate random bounce (5% chance)
        if (new Random().nextInt(100) < 5) {
            eventPublisher.publish("EMI_BOUNCED", applicationId, "Insufficient funds");
            throw new BusinessException("EMI collection failed: Insufficient funds");
        }

        EmiPaymentRequest req = new EmiPaymentRequest();
        req.setAmount(nextEmi.getEmiAmount());
        req.setGatewayRef("NACH-" + System.currentTimeMillis());
        return payEmi(applicationId, req);
    }

    @Transactional
    public LoanTransaction processPartPrepayment(Long applicationId, PrepaymentRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.ACTIVE) {
            throw new BusinessException("Prepayment only allowed for ACTIVE loans");
        }

        LoanTransaction tx = new LoanTransaction();
        tx.setApplicationId(applicationId);
        tx.setTransactionType(TransactionType.PREPAYMENT);
        tx.setAmount(req.getAmount());
        tx.setStatus("SUCCESS");
        tx.setGatewayRef("PREPAY-" + System.currentTimeMillis());
        tx.setEventTime(LocalDateTime.now());
        loanTransactionRepository.save(tx);

        // Update outstanding principal
        BigDecimal currentPrincipal = app.getOutstandingPrincipal() != null ? app.getOutstandingPrincipal() : app.getSanctionedAmount();
        app.setOutstandingPrincipal(currentPrincipal.subtract(req.getAmount()));
        if (app.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) <= 0) {
            app.setOutstandingPrincipal(BigDecimal.ZERO);
            app.setStatus(ApplicationStatus.CLOSED);
        }

        // Re-calculate schedule if loan is still active
        if (app.getStatus() == ApplicationStatus.ACTIVE) {
            // Delete future unpaid schedules
            List<EmiSchedule> unpaid = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId)
                    .stream().filter(i -> !i.isPaid()).collect(Collectors.toList());
            emiScheduleRepository.deleteAll(unpaid);
            
            // Re-build based on new principal
            rebuildScheduleAfterPrepayment(app, req.getPrepaymentType());
        }

        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        eventPublisher.publish("PREPAYMENT_SUCCESS", applicationId, req.getAmount().toPlainString());
        return tx;
    }

    @Transactional
    public LoanTransaction forecloseLoan(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        BigDecimal foreclosureAmount = app.getOutstandingPrincipal(); // Simple logic: just outstanding principal
        
        LoanTransaction tx = new LoanTransaction();
        tx.setApplicationId(applicationId);
        tx.setTransactionType(TransactionType.PREPAYMENT);
        tx.setAmount(foreclosureAmount);
        tx.setStatus("SUCCESS");
        tx.setGatewayRef("FORECLOSE-" + System.currentTimeMillis());
        tx.setEventTime(LocalDateTime.now());
        loanTransactionRepository.save(tx);

        app.setOutstandingPrincipal(BigDecimal.ZERO);
        app.setStatus(ApplicationStatus.CLOSED);
        app.setStage("STAGE_10");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);

        // Mark all EMIs as paid/closed
        List<EmiSchedule> items = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId);
        items.forEach(i -> {
            if (!i.isPaid()) {
                i.setPaid(true);
                i.setPaidAt(LocalDateTime.now());
            }
        });
        emiScheduleRepository.saveAll(items);

        eventPublisher.publish("LOAN_FORECLOSED", applicationId, foreclosureAmount.toPlainString());
        return tx;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> generateNoc(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.CLOSED) {
            throw new BusinessException("NOC can only be generated for CLOSED loans");
        }
        Map<String, Object> noc = new java.util.HashMap<>();
        noc.put("loanRef", app.getApplicationRef());
        noc.put("customerName", app.getFatherName()); // placeholder
        noc.put("closureDate", app.getUpdatedAt());
        noc.put("nocStatus", "ISSUED");
        noc.put("nocUrl", "/noc/" + applicationId + ".pdf");
        return noc;
    }

    private void rebuildScheduleAfterPrepayment(LoanApplication app, String type) {
        // Simple logic for rebuilding
        // If REDUCE_TENURE, keep EMI same, reduce months
        // If REDUCE_EMI, keep tenure same, reduce EMI
        // For simplicity in this demo, we'll just rebuild with remaining tenure and new principal
        List<EmiSchedule> paid = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(app.getId())
                .stream().filter(EmiSchedule::isPaid).collect(Collectors.toList());
        int paidCount = paid.size();
        int remainingTenure = app.getTenureMonths() - paidCount;
        
        if (remainingTenure <= 0) return;

        BigDecimal principal = app.getOutstandingPrincipal() != null ? app.getOutstandingPrincipal() : app.getSanctionedAmount();
        BigDecimal monthlyRate = app.getAnnualInterestRate().divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);
        
        int n = type.equals("REDUCE_TENURE") ? remainingTenure : remainingTenure; // Placeholder logic
        
        BigDecimal onePlusRPowerN = monthlyRate.add(BigDecimal.ONE).pow(n);
        BigDecimal emi = principal.multiply(monthlyRate).multiply(onePlusRPowerN)
                .divide(onePlusRPowerN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);

        BigDecimal balance = principal;
        List<EmiSchedule> newSchedules = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            balance = balance.subtract(principalComp).max(BigDecimal.ZERO);
            EmiSchedule row = new EmiSchedule();
            row.setApplicationId(app.getId());
            row.setInstallmentNo(paidCount + i);
            row.setDueDate(LocalDate.now().plusMonths(i));
            row.setInterestComponent(interest);
            row.setPrincipalComponent(principalComp);
            row.setEmiAmount(emi);
            row.setPaid(false);
            newSchedules.add(row);
        }
        emiScheduleRepository.saveAll(newSchedules);
    }

    @Transactional
    public LoanTransaction payEmi(Long applicationId, EmiPaymentRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.DISBURSED && app.getStatus() != ApplicationStatus.ACTIVE) {
            throw new BusinessException("Loan is not active for EMI payment");
        }
        app.setStatus(ApplicationStatus.ACTIVE);
        app.setStage("STAGE_10");
        
        List<EmiSchedule> items = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId);
        
        // Update outstanding principal on EMI payment
        BigDecimal principalPaid = items.stream().filter(i -> !i.isPaid()).findFirst()
                .map(EmiSchedule::getPrincipalComponent).orElse(BigDecimal.ZERO);
        BigDecimal currentPrincipal = app.getOutstandingPrincipal() != null ? app.getOutstandingPrincipal() : app.getSanctionedAmount();
        app.setOutstandingPrincipal(currentPrincipal.subtract(principalPaid).max(BigDecimal.ZERO));
        
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);

        LoanTransaction tx = new LoanTransaction();
        tx.setApplicationId(applicationId);
        tx.setTransactionType(TransactionType.EMI_PAYMENT);
        tx.setAmount(req.getAmount());
        tx.setStatus("SUCCESS");
        tx.setGatewayRef(req.getGatewayRef());
        tx.setEventTime(LocalDateTime.now());

        items.stream().filter(i -> !i.isPaid()).findFirst().ifPresent(i -> {
            i.setPaid(true);
            i.setPaidAt(LocalDateTime.now());
            emiScheduleRepository.save(i);
        });
        LoanTransaction saved = loanTransactionRepository.save(tx);
        eventPublisher.publish("EMI_PAYMENT_SUCCESS", applicationId, req.getAmount().toPlainString());
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<LoanApplication> listApplications(Pageable pageable) {
        return loanApplicationRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<LoanApplication> getUserApplications(Long userId, Pageable pageable) {
        return loanApplicationRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getUserStats(Long userId) {
        long total = loanApplicationRepository.countByUserId(userId);
        long approved = loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.APPROVED)
                + loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.ACCEPTED)
                + loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.AGREEMENT_EXECUTED);
        long inProgress = loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.DRAFT)
                + loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.KYC_VERIFIED)
                + loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.DOCS_COMPLETE);
        long disbursed = loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.DISBURSED)
                + loanApplicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.ACTIVE);
        return java.util.Map.of(
                "totalApplications", total,
                "approvedApplications", approved,
                "inProgressApplications", inProgress,
                "disbursedApplications", disbursed
        );
    }

    @Transactional(readOnly = true)
    public Page<LoanApplication> listManualReviewQueue(Pageable pageable) {
        return loanApplicationRepository.findByStatus(ApplicationStatus.KYC_VERIFIED, pageable);
    }

    private void buildSchedule(LoanApplication app) {
        List<EmiSchedule> schedules = new ArrayList<>();
        BigDecimal principal = app.getSanctionedAmount();
        BigDecimal monthlyRate = app.getAnnualInterestRate().divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);
        int n = app.getTenureMonths();
        BigDecimal onePlusRPowerN = monthlyRate.add(BigDecimal.ONE).pow(n);
        BigDecimal emi = principal.multiply(monthlyRate).multiply(onePlusRPowerN)
                .divide(onePlusRPowerN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
        BigDecimal balance = principal;
        for (int i = 1; i <= n; i++) {
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            balance = balance.subtract(principalComp).max(BigDecimal.ZERO);
            EmiSchedule row = new EmiSchedule();
            row.setApplicationId(app.getId());
            row.setInstallmentNo(i);
            row.setDueDate(LocalDate.now().plusMonths(i));
            row.setInterestComponent(interest);
            row.setPrincipalComponent(principalComp);
            row.setEmiAmount(emi);
            row.setPaid(false);
            schedules.add(row);
        }
        emiScheduleRepository.saveAll(schedules);
    }

    private BigDecimal calcDti(BigDecimal existingEmi, BigDecimal requestedAmount, Integer tenure, BigDecimal income) {
        if (requestedAmount == null || tenure == null || income == null || BigDecimal.ZERO.compareTo(income) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal simulatedEmi = requestedAmount.divide(BigDecimal.valueOf(tenure), 2, RoundingMode.HALF_UP);
        BigDecimal total = (existingEmi == null ? BigDecimal.ZERO : existingEmi).add(simulatedEmi);
        return total.divide(income, 4, RoundingMode.HALF_UP);
    }

    private RiskGrade riskGrade(Integer bureau) {
        if (bureau >= 750) return RiskGrade.A;
        if (bureau >= 700) return RiskGrade.B;
        if (bureau >= 650) return RiskGrade.C;
        if (bureau >= 600) return RiskGrade.D;
        return RiskGrade.E;
    }

    private BigDecimal rateForGrade(RiskGrade grade) {
        return switch (grade) {
            case A -> new BigDecimal("10.50");
            case B -> new BigDecimal("12.50");
            case C -> new BigDecimal("14.50");
            case D -> new BigDecimal("17.50");
            default -> new BigDecimal("20.00");
        };
    }

    @Transactional(readOnly = true)
    public LoanApplication getApplicationById(Long applicationId) {
        return getApplication(applicationId);
    }

    // ── Data retrieval methods for frontend display ──

    @Transactional(readOnly = true)
    public KycDetails getKycDetails(Long applicationId) {
        return kycDetailsRepository.findByApplicationId(applicationId).orElse(null);
    }

    @Transactional(readOnly = true)
    public CreditAssessment getCreditAssessment(Long applicationId) {
        return creditAssessmentRepository.findByApplicationId(applicationId).orElse(null);
    }

    @Transactional(readOnly = true)
    public LoanOffer getOffer(Long applicationId) {
        return loanOfferRepository.findByApplicationId(applicationId).orElse(null);
    }

    @Transactional(readOnly = true)
    public LoanAgreement getAgreement(Long applicationId) {
        return loanAgreementRepository.findByApplicationId(applicationId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Disbursement getDisbursement(Long applicationId) {
        return disbursementRepository.findByApplicationId(applicationId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFullApplicationDetails(Long applicationId) {
        LoanApplication app = getApplication(applicationId);
        Map<String, Object> details = new java.util.HashMap<>();
        details.put("application", app);
        details.put("kyc", getKycDetails(applicationId));
        details.put("documents", getDocuments(applicationId));
        details.put("credit", getCreditAssessment(applicationId));
        details.put("offer", getOffer(applicationId));
        details.put("agreement", getAgreement(applicationId));
        details.put("disbursement", getDisbursement(applicationId));
        return details;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmiSchedule(Long applicationId) {
        try {
            LoanApplication app = getApplication(applicationId);
            List<EmiSchedule> items = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId);
            log.info("Found {} EMI schedule items for application {}", items.size(), applicationId);

            BigDecimal totalOutstanding = app.getOutstandingPrincipal() != null ? app.getOutstandingPrincipal() : 
                    items.stream()
                    .filter(i -> !i.isPaid())
                    .map(i -> i.getEmiAmount() != null ? i.getEmiAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            long paidEmis = items.stream().filter(EmiSchedule::isPaid).count();
            BigDecimal monthlyEmi = items.isEmpty() ? BigDecimal.ZERO : items.get(0).getEmiAmount();

            List<Map<String, Object>> installments = items.stream().map(i -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("installmentNumber", i.getInstallmentNo());
                m.put("dueDate", i.getDueDate());
                m.put("principal", i.getPrincipalComponent());
                m.put("interest", i.getInterestComponent());
                m.put("totalEmi", i.getEmiAmount());
                m.put("outstandingBalance", i.getEmiAmount());
                m.put("status", i.isPaid() ? "PAID" : "DUE");
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> res = new java.util.HashMap<>();
            res.put("totalOutstanding", totalOutstanding);
            res.put("totalEmis", items.size());
            res.put("paidEmis", paidEmis);
            res.put("monthlyEmi", monthlyEmi);
            res.put("installments", installments);
            return res;
        } catch (Exception e) {
            log.error("Error fetching EMI schedule for {}: {}", applicationId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTransactions(Long applicationId) {
        try {
            log.info("Fetching transactions for application {}", applicationId);
            List<LoanTransaction> txs = loanTransactionRepository.findByApplicationIdOrderByEventTimeDesc(applicationId);
            return txs.stream().map(t -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", String.valueOf(t.getId()));
                m.put("transactionType", t.getTransactionType());
                m.put("amount", t.getAmount());
                m.put("status", t.getStatus());
                m.put("gatewayRef", t.getGatewayRef());
                m.put("paymentDate", t.getEventTime());
                m.put("installmentNumber", 0); // Default or calculated
                return m;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching transactions for {}: {}", applicationId, e.getMessage(), e);
            throw e;
        }
    }

    private LoanApplication getApplication(Long applicationId) {
        return loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Application not found"));
    }
}
