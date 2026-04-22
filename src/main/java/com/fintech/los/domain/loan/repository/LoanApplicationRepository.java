package com.fintech.los.domain.loan.repository;

import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    Optional<LoanApplication> findByApplicationRef(String applicationRef);
    Page<LoanApplication> findByStatus(ApplicationStatus status, Pageable pageable);
    Page<LoanApplication> findByUserId(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, ApplicationStatus status);
}
