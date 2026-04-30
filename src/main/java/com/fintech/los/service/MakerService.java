package com.fintech.los.service;

import com.fintech.los.common.audit.model.LoanAuditLog;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.TierConfig;
import com.fintech.los.domain.loan.repository.ApprovalTaskRepository;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MakerService {

    private final LoanApplicationRepository applicationRepository;
    private final ApprovalTaskRepository taskRepository;
    private final TierRoutingService tierRoutingService;
    private final LoanAuditService auditService;
    private final MisAlertService misAlertService;

    @Transactional
    public LoanApplication submitApplication(LoanApplication application, User maker) {
        Tier tier = tierRoutingService.determineTier(application.getRequestedAmount());
        TierConfig config = tierRoutingService.getConfig(tier);

        application.setTier(tier);
        application.setCreatedBy(maker.getId());
        application.setStatus(ApplicationStatus.SUBMITTED);
        application.setSlaDeadline(LocalDateTime.now().plusDays(config.getSlaWorkingDays()));
        application.setSubmittedAt(LocalDateTime.now());
        
        LoanApplication savedApp = applicationRepository.save(application);
        auditService.logAction(savedApp, maker, "SUBMITTED");

        if (config.isAutoDecisionEnabled()) {
            // Tier 1 STP logic will be called from here or a listener
        }

        return savedApp;
    }

    @Transactional
    public LoanApplication approveForKyc(Long applicationId, User maker) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new IllegalStateException("Only SUBMITTED applications can be approved for KYC");
        }

        application.setStatus(ApplicationStatus.MAKER_CHECKED);
        LoanApplication savedApp = applicationRepository.save(application);
        auditService.logAction(savedApp, maker, "ALLOWED_KYC");

        return savedApp;
    }

    @Transactional
    public LoanApplication updatePermission(Long applicationId, Integer allowedStage, User maker) {
        try {
            LoanApplication application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new IllegalArgumentException("Application not found with ID: " + applicationId));

            ApplicationStatus previousStatus = application.getStatus();
            application.setAllowedStage(allowedStage);
            
            // If Maker allows stage 3 or higher, we can automatically update status to MAKER_CHECKED
            if (allowedStage >= 3 && previousStatus == ApplicationStatus.SUBMITTED) {
                application.setStatus(ApplicationStatus.MAKER_CHECKED);
            }

            LoanApplication savedApp = applicationRepository.save(application);
            
            // Log with previous status for accurate audit trail
            LoanAuditLog log = new LoanAuditLog();
            log.setApplicationId(savedApp.getId());
            log.setActorId(maker.getId());
            log.setActorRole(maker.getRole());
            log.setAction("PERMISSION_UPDATED_TO_STAGE_" + allowedStage);
            log.setPreviousStatus(previousStatus);
            log.setNewStatus(savedApp.getStatus());
            log.setTimestamp(LocalDateTime.now());
            
            auditService.logManualAction(log);

            return savedApp;
        } catch (Exception e) {
            // Rethrow as a business exception or wrap it to provide more context
            throw new RuntimeException("Failed to update permission for application " + applicationId + ": " + e.getMessage(), e);
        }
    }

    @Transactional
    public LoanApplication recommendToChecker(Long applicationId, User maker, Long checkerId, String remarks) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        ApplicationStatus previousStatus = application.getStatus();

        if (previousStatus != ApplicationStatus.SUBMITTED && 
            previousStatus != ApplicationStatus.MAKER_CHECKED &&
            previousStatus != ApplicationStatus.KYC_VERIFIED &&
            previousStatus != ApplicationStatus.DOCS_COMPLETE &&
            previousStatus != ApplicationStatus.RETURNED &&
            previousStatus != ApplicationStatus.APPROVED &&
            previousStatus != ApplicationStatus.ACCEPTED &&
            previousStatus != ApplicationStatus.AGREEMENT_EXECUTED) {
            throw new IllegalStateException("Application status '" + previousStatus + "' is not eligible for Maker review");
        }

        Tier tier = tierRoutingService.determineTier(application.getRequestedAmount());
        TierConfig config = tierRoutingService.getConfig(tier);

        application.setTier(tier);
        application.setSlaDeadline(LocalDateTime.now().plusDays(config.getSlaWorkingDays()));

        if (tier == Tier.TIER_1) {
            // Tier 1: System is the checker (Auto-approval after Maker recommendation)
            application.setStatus(ApplicationStatus.APPROVED);
            application.setCurrentAssignedTo(null);
            LoanApplication savedApp = applicationRepository.save(application);
            
            // Log with previous status
            LoanAuditLog log = new LoanAuditLog();
            log.setApplicationId(savedApp.getId());
            log.setActorId(maker.getId());
            log.setActorRole(maker.getRole());
            log.setAction("AUTO_APPROVED_TIER1");
            log.setPreviousStatus(previousStatus);
            log.setNewStatus(savedApp.getStatus());
            auditService.logManualAction(log);
            
            misAlertService.sendTier1Alert(savedApp);
            return savedApp;
        } else {
            // Tier 2, 3, 4: Requires human checker
            if (checkerId == null) {
                throw new IllegalArgumentException("Checker selection is required for Tier " + tier);
            }
            
            application.setStatus(ApplicationStatus.UNDER_REVIEW);
            application.setCurrentAssignedTo(checkerId);
            
            LoanApplication savedApp = applicationRepository.save(application);
            
            // Log with previous status
            LoanAuditLog log = new LoanAuditLog();
            log.setApplicationId(savedApp.getId());
            log.setActorId(maker.getId());
            log.setActorRole(maker.getRole());
            log.setAction("RECOMMENDED_TO_CHECKER");
            log.setPreviousStatus(previousStatus);
            log.setNewStatus(savedApp.getStatus());
            auditService.logManualAction(log);

            createNextTask(savedApp, config, checkerId, remarks);
            return savedApp;
        }
    }

    public com.fintech.los.domain.loan.LoanEnums.Tier getTierForApplication(LoanApplication application) {
        return tierRoutingService.determineTier(application.getRequestedAmount());
    }

    public com.fintech.los.domain.loan.LoanEnums.UserRole getRequiredRoleForTier(com.fintech.los.domain.loan.LoanEnums.Tier tier) {
        return tierRoutingService.getConfig(tier).getRequiredCheckerRole();
    }

    private void createNextTask(LoanApplication application, TierConfig config, Long checkerId, String remarks) {
        ApprovalTask task = new ApprovalTask();
        task.setApplicationId(application.getId());
        task.setTier(application.getTier());
        task.setLevel(1);
        task.setAssignedTo(checkerId);
        task.setAssignedRole(config.getRequiredCheckerRole());
        task.setStatus(TaskStatus.PENDING);
        task.setRemarks(remarks);
        task.setCreatedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Transactional
    public LoanApplication resubmitAfterReturn(Long applicationId, User maker) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (application.getStatus() != ApplicationStatus.RETURNED) {
            throw new IllegalStateException("Only RETURNED applications can be resubmitted");
        }

        application.setStatus(ApplicationStatus.SUBMITTED);
        LoanApplication savedApp = applicationRepository.save(application);
        auditService.logAction(savedApp, maker, "RESUBMITTED");

        return savedApp;
    }
}
