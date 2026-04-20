package com.fintech.los.domain.disbursement.repository;

import com.fintech.los.domain.disbursement.Disbursement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DisbursementRepository extends JpaRepository<Disbursement, Long> {
    Optional<Disbursement> findByApplicationId(Long applicationId);
}
