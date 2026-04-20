package com.fintech.los.domain.agreement.repository;

import com.fintech.los.domain.agreement.LoanAgreement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanAgreementRepository extends JpaRepository<LoanAgreement, Long> {
    Optional<LoanAgreement> findByApplicationId(Long applicationId);
}
