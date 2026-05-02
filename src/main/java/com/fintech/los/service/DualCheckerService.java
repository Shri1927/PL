package com.fintech.los.service;

import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.repository.ApprovalTaskRepository;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DualCheckerService {

    private final LoanApplicationRepository applicationRepository;
    private final ApprovalTaskRepository taskRepository;
    private final LoanAuditService auditService;

    @Transactional
    public void processTier3Approval(Long applicationId, User checker) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (application.getTier() != Tier.TIER_3) {
            return;
        }

        List<ApprovalTask> tasks = taskRepository.findByApplicationId(applicationId);
        long approvedCount = tasks.stream()
                .filter(t -> t.getTier() == Tier.TIER_3 && t.getStatus() == TaskStatus.APPROVED)
                .count();

        // Tier 3 requires 2 approvals (Regional Credit Mgr + Zonal Head)
        if (approvedCount >= 2) {
            application.setStatus(ApplicationStatus.APPROVED);
            applicationRepository.save(application);
            auditService.logAction(application, checker, "FINAL_APPROVED_TIER3");
        } else {
            // Still UNDER_REVIEW, wait for second checker
            application.setStatus(ApplicationStatus.UNDER_REVIEW);
            applicationRepository.save(application);
        }
    }
}
