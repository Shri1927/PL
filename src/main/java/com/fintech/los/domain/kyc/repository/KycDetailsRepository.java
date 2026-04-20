package com.fintech.los.domain.kyc.repository;

import com.fintech.los.domain.kyc.KycDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KycDetailsRepository extends JpaRepository<KycDetails, Long> {
    Optional<KycDetails> findByApplicationId(Long applicationId);
}
