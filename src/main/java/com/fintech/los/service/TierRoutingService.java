package com.fintech.los.service;

import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.TierConfig;
import com.fintech.los.domain.loan.repository.TierConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TierRoutingService {

    private final TierConfigRepository tierConfigRepository;

    public Tier determineTier(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null for tier determination");
        }
        
        List<TierConfig> configs = tierConfigRepository.findAll();
        // Sort by minAmount to ensure we check in order
        configs.sort((c1, c2) -> c1.getMinAmount().compareTo(c2.getMinAmount()));
        
        for (TierConfig config : configs) {
            if (amount.compareTo(config.getMinAmount()) >= 0 && 
                (config.getMaxAmount() == null || amount.compareTo(config.getMaxAmount()) <= 0)) {
                return config.getTier();
            }
        }
        
        // If not found in configs, find the one with highest minAmount as fallback for Tier 4
        return configs.stream()
                .filter(c -> c.getMaxAmount() == null || amount.compareTo(c.getMaxAmount()) > 0)
                .map(TierConfig::getTier)
                .reduce((first, second) -> second) // Get the last one
                .orElseThrow(() -> new IllegalStateException("No TierConfig found for amount: " + amount));
    }

    public TierConfig getConfig(Tier tier) {
        return tierConfigRepository.findByTier(tier)
                .orElseThrow(() -> new IllegalArgumentException("Invalid tier: " + tier));
    }
}
