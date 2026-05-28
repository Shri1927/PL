package com.fintech.los.service;

import com.fintech.los.common.exception.BusinessException;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import com.fintech.los.domain.loan.repository.ApprovalTaskRepository;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import com.fintech.los.domain.agreement.repository.LoanAgreementRepository;
import com.fintech.los.domain.auth.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CheckerService — Defense-in-Depth Role Verification Tests")
class CheckerServiceRoleGuardTest {

    @Mock ApprovalTaskRepository taskRepository;
    @Mock LoanApplicationRepository applicationRepository;
    @Mock LoanAuditService auditService;
    @Mock DualCheckerService dualCheckerService;
    @Mock TierRoutingService tierRoutingService;
    @Mock LoanAgreementRepository loanAgreementRepository;
    @Mock LoanWorkflowService loanWorkflowService;
    @Mock UserRepository userRepository;

    @InjectMocks
    CheckerService checkerService;

    // -------------------------------------------------------------------------
    // Test 1: approve() blocked when checker role != task required role
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🚫 approve() — checker with wrong role is rejected")
    void approve_wrongRole_isRejected() {
        ApprovalTask task = task(UserRole.BRANCH_MANAGER, null);
        LoanApplication app = app(2L);  // different creator

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(applicationRepository.findById(10L)).thenReturn(Optional.of(app));

        // Checker has LOAN_OFFICER role, but task requires BRANCH_MANAGER
        User checker = user(99L, UserRole.LOAN_OFFICER);

        assertThatThrownBy(() -> checkerService.approve(1L, checker))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Access denied")
                .hasMessageContaining("BRANCH_MANAGER");
    }

    // -------------------------------------------------------------------------
    // Test 2: approve() blocked when task is assigned to a different user
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🚫 approve() — task assigned to different user is rejected")
    void approve_assignedToDifferentUser_isRejected() {
        // Task requires BRANCH_MANAGER and is specifically assigned to user 55
        ApprovalTask task = task(UserRole.BRANCH_MANAGER, 55L);
        LoanApplication app = app(2L);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(applicationRepository.findById(10L)).thenReturn(Optional.of(app));

        // Checker has correct role but is user 99, not 55
        User checker = user(99L, UserRole.BRANCH_MANAGER);

        assertThatThrownBy(() -> checkerService.approve(1L, checker))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not assigned to you");
    }

    // -------------------------------------------------------------------------
    // Test 3: approve() blocked by same-user lock (maker = checker)
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🚫 approve() — same-user lock: maker cannot approve own application")
    void approve_sameUserLock_isRejected() {
        // Task requires BRANCH_MANAGER, assigned to user 1
        ApprovalTask task = task(UserRole.BRANCH_MANAGER, 1L);
        // Application created by user 1 (same as checker)
        LoanApplication app = app(1L);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(applicationRepository.findById(10L)).thenReturn(Optional.of(app));

        User checker = user(1L, UserRole.BRANCH_MANAGER);

        assertThatThrownBy(() -> checkerService.approve(1L, checker))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Same-user lock");
    }

    // -------------------------------------------------------------------------
    // Test 4: reject() — wrong role is blocked
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🚫 reject() — checker with wrong role is rejected")
    void reject_wrongRole_isRejected() {
        ApprovalTask task = task(UserRole.ZONAL_HEAD, null);
        LoanApplication app = app(2L);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(applicationRepository.findById(10L)).thenReturn(Optional.of(app));

        // Checker has BRANCH_MANAGER, task requires ZONAL_HEAD
        User checker = user(99L, UserRole.BRANCH_MANAGER);
        String remarks = "Rejecting because the documents are insufficient for this loan.";

        assertThatThrownBy(() -> checkerService.reject(1L, remarks, checker))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Access denied")
                .hasMessageContaining("ZONAL_HEAD");
    }

    // -------------------------------------------------------------------------
    // Test 5: returnToMaker() — wrong role is blocked
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("🚫 returnToMaker() — checker with wrong role is rejected")
    void returnToMaker_wrongRole_isRejected() {
        ApprovalTask task = task(UserRole.REGIONAL_CREDIT_MGR, null);
        LoanApplication app = app(2L);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(applicationRepository.findById(10L)).thenReturn(Optional.of(app));

        // Checker has BRANCH_MANAGER, task requires REGIONAL_CREDIT_MGR
        User checker = user(99L, UserRole.BRANCH_MANAGER);
        String remarks = "Returning because the KYC documentation is incomplete for review.";

        assertThatThrownBy(() -> checkerService.returnToMaker(1L, remarks, checker))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Access denied");
    }

    // -------------------------------------------------------------------------
    // Test 6: reject() — short remarks are rejected before role check
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("❌ reject() — remarks shorter than 20 chars are rejected")
    void reject_shortRemarks_isRejected() {
        User checker = user(99L, UserRole.BRANCH_MANAGER);

        assertThatThrownBy(() -> checkerService.reject(1L, "Too short", checker))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 20 characters");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private ApprovalTask task(UserRole requiredRole, Long assignedTo) {
        ApprovalTask t = new ApprovalTask();
        t.setId(1L);
        t.setApplicationId(10L);
        t.setAssignedRole(requiredRole);
        t.setAssignedTo(assignedTo);
        t.setStatus(TaskStatus.PENDING);
        t.setLevel(1);
        return t;
    }

    private LoanApplication app(Long createdBy) {
        LoanApplication a = new LoanApplication();
        a.setId(10L);
        a.setCreatedBy(createdBy);
        a.setRequestedAmount(BigDecimal.valueOf(500000));
        a.setTier(com.fintech.los.domain.loan.LoanEnums.Tier.TIER_2);
        return a;
    }

    private User user(Long id, UserRole role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }
}
