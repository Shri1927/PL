package com.fintech.los.service;

import com.fintech.los.common.dto.LoanWorkflowDtos.*;
import com.fintech.los.common.exception.BusinessException;
import com.fintech.los.domain.agreement.LoanAgreement;
import com.fintech.los.domain.agreement.repository.LoanAgreementRepository;
import com.fintech.los.domain.credit.CreditAssessment;
import com.fintech.los.domain.credit.repository.CreditAssessmentRepository;
import com.fintech.los.domain.disbursement.Disbursement;
import com.fintech.los.domain.disbursement.repository.DisbursementRepository;
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
import java.util.Random;

@Service
@RequiredArgsConstructor
public class LoanWorkflowService {
    private final LoanApplicationRepository loanApplicationRepository;
    private final KycDetailsRepository kycDetailsRepository;
    private final CreditAssessmentRepository creditAssessmentRepository;
    private final LoanOfferRepository loanOfferRepository;
    private final LoanAgreementRepository loanAgreementRepository;
    private final DisbursementRepository disbursementRepository;
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
        app.setStage("STAGE_03");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        KycDetails saved = kycDetailsRepository.save(k);
        eventPublisher.publish("KYC_VERIFIED", applicationId, saved.getStatus().name());
        return saved;
    }

    @Transactional
    public CreditAssessment assessCredit(Long applicationId, CreditDecisionRequest req) {
        LoanApplication app = getApplication(applicationId);
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
            throw new BusinessException("Offer generation requires approved application");
        }
        LoanOffer o = loanOfferRepository.findByApplicationId(applicationId).orElse(new LoanOffer());
        o.setApplicationId(applicationId);
        o.setValidTill(LocalDateTime.now().plusDays(30));
        o.setProcessingFee(app.getSanctionedAmount().multiply(new BigDecimal("0.02")).setScale(2, RoundingMode.HALF_UP));
        o.setInsurancePremium(BigDecimal.ZERO);
        o.setApr(app.getAnnualInterestRate().add(new BigDecimal("0.75")));
        o.setCreatedAt(LocalDateTime.now());
        o.setUpdatedAt(LocalDateTime.now());
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
        app.setStage("STAGE_09");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);
        buildSchedule(app);
        Disbursement saved = disbursementRepository.save(d);
        eventPublisher.publish("DISBURSEMENT_SUCCESS", applicationId, saved.getUtr());
        return saved;
    }

    @Transactional
    public LoanTransaction payEmi(Long applicationId, EmiPaymentRequest req) {
        LoanApplication app = getApplication(applicationId);
        if (app.getStatus() != ApplicationStatus.DISBURSED && app.getStatus() != ApplicationStatus.ACTIVE) {
            throw new BusinessException("Loan is not active for EMI payment");
        }
        app.setStatus(ApplicationStatus.ACTIVE);
        app.setStage("STAGE_10");
        app.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(app);

        LoanTransaction tx = new LoanTransaction();
        tx.setApplicationId(applicationId);
        tx.setTransactionType(TransactionType.EMI_PAYMENT);
        tx.setAmount(req.getAmount());
        tx.setStatus("SUCCESS");
        tx.setGatewayRef(req.getGatewayRef());
        tx.setEventTime(LocalDateTime.now());

        List<EmiSchedule> items = emiScheduleRepository.findByApplicationIdOrderByInstallmentNo(applicationId);
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

    private LoanApplication getApplication(Long applicationId) {
        return loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Application not found"));
    }
}
