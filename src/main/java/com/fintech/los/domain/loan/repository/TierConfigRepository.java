package com.fintech.los.domain.loan.repository;

import com.fintech.los.domain.loan.TierConfig;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TierConfigRepository extends JpaRepository<TierConfig, Long> {
    Optional<TierConfig> findByTier(Tier tier);
}
