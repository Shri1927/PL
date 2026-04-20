package com.fintech.los.domain.credit.repository;

import com.fintech.los.domain.credit.CreditAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreditAssessmentRepository extends JpaRepository<CreditAssessment, Long> {
    Optional<CreditAssessment> findByApplicationId(Long applicationId);
}
