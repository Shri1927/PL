package com.fintech.los.service;

import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.repository.ApprovalTaskRepository;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import com.fintech.los.domain.agreement.repository.LoanAgreementRepository;
import com.fintech.los.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CheckerService {

    private final LoanApplicationRepository applicationRepository;
    private final ApprovalTaskRepository taskRepository;
    private final LoanAuditService auditService;
    private final DualCheckerService dualCheckerService;
    private final TierRoutingService tierRoutingService;
    private final LoanAgreementRepository loanAgreementRepository;
    private final LoanWorkflowService loanWorkflowService;
    private final UserRepository userRepository;

    @Transactional
    public void approve(Long taskId, User checker) {
        ApprovalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        LoanApplication application = applicationRepository.findById(task.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        // Defense-in-depth: verify the checker's actual DB role matches the task's required role
        if (task.getAssignedRole() != null && !task.getAssignedRole().equals(checker.getRole())) {
            throw new IllegalStateException(
                    "Access denied: this task requires role " + task.getAssignedRole() +
                    " but your role is " + checker.getRole());
        }
        // Defense-in-depth: verify the task is assigned to this specific checker (if set)
        if (task.getAssignedTo() != null && !task.getAssignedTo().equals(checker.getId())) {
            throw new IllegalStateException("Access denied: this task is not assigned to you.");
        }

        // 1. Same-user lock
        if (checker.getId().equals(application.getCreatedBy())) {
            throw new IllegalStateException("Same-user lock: Maker cannot approve their own application");
        }

        // 2. Authority-band lock
        if (checker.getApprovalLimit() != null && checker.getApprovalLimit().compareTo(application.getRequestedAmount()) < 0) {
            java.util.List<User> sameRoleCheckers = userRepository.findByRole(checker.getRole());
            java.math.BigDecimal maxLimit = sameRoleCheckers.stream()
                    .map(User::getApprovalLimit)
                    .filter(java.util.Objects::nonNull)
                    .max(java.math.BigDecimal::compareTo)
                    .orElse(java.math.BigDecimal.ZERO);
            
            if (checker.getApprovalLimit().compareTo(maxLimit) < 0) {
                throw new IllegalStateException("Authority-band lock: Loan amount exceeds checker's approval limit");
            }
        }

        task.setStatus(TaskStatus.APPROVED);
        task.setAssignedTo(checker.getId());
        task.setActionedAt(LocalDateTime.now());
        taskRepository.save(task);

        // Check if agreement is executed (and is signed) to determine if this is disbursement approval
        boolean isDisbursementApproval = loanAgreementRepository.findByApplicationId(application.getId())
                .map(com.fintech.los.domain.agreement.LoanAgreement::isSigned)
                .orElse(false);

        if (isDisbursementApproval) {
            com.fintech.los.common.dto.LoanWorkflowDtos.DisbursementRequest disbReq = 
                new com.fintech.los.common.dto.LoanWorkflowDtos.DisbursementRequest();
            disbReq.setBankAccount(application.getBankAccountNumber());
            disbReq.setIfsc(application.getBankIfsc());
            
            loanWorkflowService.disburse(application.getId(), disbReq);
            
            // Instantly transition to ACTIVE/active loan state
            application.setStatus(com.fintech.los.domain.loan.LoanEnums.ApplicationStatus.ACTIVE);
            application.setStage("STAGE_10");
            application.setAllowedStage(10);
            application.setMandateStatus("REGISTERED");
            applicationRepository.save(application);
            
            auditService.logAction(application, checker, "DISBURSEMENT_APPROVED");
        } else {
            // Handle multi-level approval
            if (application.getTier() == com.fintech.los.domain.loan.LoanEnums.Tier.TIER_3) {
                if (task.getLevel() == 1) {
                    // Create Level 2 task for Zonal Head
                    createNextLevelTask(application, 2, com.fintech.los.domain.loan.LoanEnums.UserRole.ZONAL_HEAD);
                    application.setStatus(ApplicationStatus.UNDER_REVIEW);
                    applicationRepository.save(application);
                    auditService.logAction(application, checker, "APPROVED_LEVEL_1");
                } else {
                    dualCheckerService.processTier3Approval(application.getId(), checker);
                }
            } else {
                application.setStatus(ApplicationStatus.APPROVED);
                applicationRepository.save(application);
                auditService.logAction(application, checker, "APPROVED");
            }
        }
    }

    private void createNextLevelTask(LoanApplication application, int level, com.fintech.los.domain.loan.LoanEnums.UserRole role) {
        ApprovalTask nextTask = new ApprovalTask();
        nextTask.setApplicationId(application.getId());
        nextTask.setTier(application.getTier());
        nextTask.setLevel(level);
        nextTask.setAssignedRole(role);
        nextTask.setStatus(TaskStatus.PENDING);
        nextTask.setCreatedAt(LocalDateTime.now());
        taskRepository.save(nextTask);
    }

    @Transactional
    public void reject(Long taskId, String remarks, User checker) {
        if (remarks == null || remarks.length() < 20) {
            throw new IllegalArgumentException("Remarks are mandatory and must be at least 20 characters");
        }

        ApprovalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        LoanApplication application = applicationRepository.findById(task.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        // Defense-in-depth: verify the checker's actual DB role matches the task's required role
        if (task.getAssignedRole() != null && !task.getAssignedRole().equals(checker.getRole())) {
            throw new IllegalStateException(
                    "Access denied: this task requires role " + task.getAssignedRole() +
                    " but your role is " + checker.getRole());
        }
        if (task.getAssignedTo() != null && !task.getAssignedTo().equals(checker.getId())) {
            throw new IllegalStateException("Access denied: this task is not assigned to you.");
        }

        task.setStatus(TaskStatus.REJECTED);
        task.setRemarks(remarks);
        task.setAssignedTo(checker.getId());
        task.setActionedAt(LocalDateTime.now());
        taskRepository.save(task);

        application.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(application);
        auditService.logAction(application, checker, "REJECTED");
    }

    @Transactional
    public void returnToMaker(Long taskId, String remarks, User checker) {
        if (remarks == null || remarks.length() < 20) {
            throw new IllegalArgumentException("Remarks are mandatory for return and must be at least 20 characters");
        }

        ApprovalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        LoanApplication application = applicationRepository.findById(task.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        // Defense-in-depth: verify the checker's actual DB role matches the task's required role
        if (task.getAssignedRole() != null && !task.getAssignedRole().equals(checker.getRole())) {
            throw new IllegalStateException(
                    "Access denied: this task requires role " + task.getAssignedRole() +
                    " but your role is " + checker.getRole());
        }
        if (task.getAssignedTo() != null && !task.getAssignedTo().equals(checker.getId())) {
            throw new IllegalStateException("Access denied: this task is not assigned to you.");
        }

        task.setStatus(TaskStatus.RETURNED);
        task.setRemarks(remarks);
        task.setAssignedTo(checker.getId());
        task.setActionedAt(LocalDateTime.now());
        taskRepository.save(task);

        application.setStatus(ApplicationStatus.RETURNED);
        applicationRepository.save(application);
        auditService.logAction(application, checker, "RETURNED");
    }
}
