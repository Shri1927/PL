package com.fintech.los.domain.offer.repository;

import com.fintech.los.domain.offer.LoanOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanOfferRepository extends JpaRepository<LoanOffer, Long> {
    Optional<LoanOffer> findByApplicationId(Long applicationId);
}
