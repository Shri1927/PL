package com.fintech.los.domain.loan;

import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "tier_configs")
public class TierConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true)
    private Tier tier;

    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    @Enumerated(EnumType.STRING)
    private UserRole requiredCheckerRole;

    private boolean dualCheckerRequired;
    private Integer slaWorkingDays;
    private boolean autoDecisionEnabled;
}
