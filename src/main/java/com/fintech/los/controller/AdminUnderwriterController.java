package com.fintech.los.controller;

import com.fintech.los.common.response.ApiResponse;
import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.service.LoanWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminUnderwriterController {
    private final LoanWorkflowService service;

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER')")
    public ApiResponse<Page<LoanApplication>> listApplications(@RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ok(service.listApplications(pageable), "Applications fetched");
    }

    @GetMapping("/underwriter/manual-queue")
    @PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER')")
    public ApiResponse<Page<LoanApplication>> manualQueue(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ok(service.listManualReviewQueue(pageable), "Manual queue fetched");
    }

    private <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .timestamp(Instant.now())
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
