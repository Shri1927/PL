package com.fintech.los.controller;

import com.fintech.los.common.audit.model.LoanAuditLog;
import com.fintech.los.common.audit.repository.LoanAuditLogRepository;
import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.auth.repository.UserRepository;
import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.repository.ApprovalTaskRepository;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import com.fintech.los.service.CheckerService;
import com.fintech.los.service.MakerService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/maker-checker")
@RequiredArgsConstructor
public class MakerCheckerController {

    private final MakerService makerService;
    private final CheckerService checkerService;
    private final LoanApplicationRepository applicationRepository;
    private final ApprovalTaskRepository taskRepository;
    private final LoanAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @PostMapping("/loans")
    public ApiResponse<LoanApplication> submit(@RequestBody LoanApplication application) {
        User user = getCurrentUser();
        return ok(makerService.submitApplication(application, user), "Application submitted");
    }

    @PostMapping("/loans/{id}/allow-kyc")
    public ApiResponse<LoanApplication> allowKyc(@PathVariable Long id) {
        User user = getCurrentUser();
        return ok(makerService.approveForKyc(id, user), "Application allowed for KYC");
    }

    @PostMapping("/loans/{id}/update-permission")
    public ApiResponse<LoanApplication> updatePermission(@PathVariable Long id, @RequestParam Integer allowedStage) {
        User user = getCurrentUser();
        return ok(makerService.updatePermission(id, allowedStage, user), "Workflow permission updated");
    }

    @PostMapping("/loans/{id}/recommend")
    public ApiResponse<LoanApplication> recommend(@PathVariable Long id, @RequestBody RecommendRequest request) {
        User user = getCurrentUser();
        return ok(makerService.recommendToChecker(id, user, request.getCheckerId(), request.getRemarks()), "Application recommended to checker");
    }

    @GetMapping("/checkers")
    public ApiResponse<List<User>> getAvailableCheckers(@RequestParam com.fintech.los.domain.loan.LoanEnums.UserRole role) {
        return ok(userRepository.findByRole(role), "Available checkers fetched");
    }

    @GetMapping("/loans/{id}/required-role")
    public ApiResponse<com.fintech.los.domain.loan.LoanEnums.UserRole> getRequiredRole(@PathVariable Long id) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        com.fintech.los.domain.loan.LoanEnums.Tier tier = makerService.getTierForApplication(application);
        return ok(makerService.getRequiredRoleForTier(tier), "Required role fetched");
    }

    @PostMapping("/loans/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id, @RequestParam Long taskId) {
        User user = getCurrentUser();
        checkerService.approve(taskId, user);
        return ok(null, "Task approved");
    }

    @PostMapping("/loans/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id, @RequestParam Long taskId, @RequestBody RemarksRequest request) {
        User user = getCurrentUser();
        checkerService.reject(taskId, request.getRemarks(), user);
        return ok(null, "Task rejected");
    }

    @PostMapping("/loans/{id}/return")
    public ApiResponse<Void> returnToMaker(@PathVariable Long id, @RequestParam Long taskId, @RequestBody RemarksRequest request) {
        User user = getCurrentUser();
        checkerService.returnToMaker(taskId, request.getRemarks(), user);
        return ok(null, "Task returned to maker");
    }

    @PostMapping("/loans/{id}/resubmit")
    public ApiResponse<LoanApplication> resubmit(@PathVariable Long id) {
        User user = getCurrentUser();
        return ok(makerService.resubmitAfterReturn(id, user), "Application resubmitted");
    }

    @GetMapping("/loans/{id}/audit")
    public ApiResponse<List<LoanAuditLog>> getAuditTrail(@PathVariable Long id) {
        return ok(auditLogRepository.findByApplicationIdOrderByTimestampDesc(id), "Audit trail fetched");
    }

    @GetMapping("/dashboard/maker")
    public ApiResponse<List<LoanApplication>> getMakerQueue() {
        User user = getCurrentUser();
        return ok(applicationRepository.findByCreatedBy(user.getId()), "Maker queue fetched");
    }

    @GetMapping("/dashboard/checker")
    public ApiResponse<List<ApprovalTask>> getCheckerQueue() {
        User user = getCurrentUser();
        // Return tasks assigned to the user directly OR to their role
        return ok(taskRepository.findByStatusAndAssignedRoleOrAssignedTo(
                TaskStatus.PENDING, user.getRole(), user.getId()), "Checker queue fetched");
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userId;
        if (principal instanceof String) {
            userId = (String) principal;
        } else {
            userId = principal.toString(); // Fallback for other principal types
        }
        
        return userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("Current user not found for ID: " + userId));
    }

    private <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().timestamp(Instant.now()).success(true).message(message).data(data).build();
    }

    @Data
    public static class RemarksRequest {
        private String remarks;
    }

    @Data
    public static class RecommendRequest {
        private Long checkerId;
        private String remarks;
    }
}
