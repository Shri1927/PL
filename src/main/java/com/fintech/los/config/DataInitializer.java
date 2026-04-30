package com.fintech.los.config;

import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.auth.repository.UserRepository;
import com.fintech.los.domain.loan.LoanEnums.Tier;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import com.fintech.los.domain.loan.TierConfig;
import com.fintech.los.domain.loan.repository.TierConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TierConfigRepository tierConfigRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            if (tierConfigRepository.count() == 0) {
                seedTierConfigs();
            }
            seedDemoUsers();
        } catch (Exception e) {
            System.err.println("FAILED TO INITIALIZE DATA: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void seedDemoUsers() {
        // Default users from data.sql
        createUser("9999990001", "System Admin", UserRole.ADMIN, null);
        createUser("9999990002", "Credit Underwriter", UserRole.UNDERWRITER, null);
        createUser("9999990003", "Demo Customer", UserRole.CUSTOMER, null);

        // Workflow demo users
        createUser("9999999999", "Maker One", UserRole.LOAN_OFFICER, null);

        // Checker - Branch Manager (Limit 10L)
        createUser("8888888888", "Checker BM 01", UserRole.BRANCH_MANAGER, new BigDecimal("1000000"));
        createUser("8888888889", "Checker BM 02", UserRole.BRANCH_MANAGER, new BigDecimal("1000000"));

        // Checker - Regional Mgr (Limit 25L)
        createUser("7777777777", "Checker RCM 01", UserRole.REGIONAL_CREDIT_MGR, new BigDecimal("2500000"));
        createUser("7777777778", "Checker RCM 02", UserRole.REGIONAL_CREDIT_MGR, new BigDecimal("2500000"));
    }

    private void createUser(String mobile, String name, UserRole role, BigDecimal limit) {
        User user = userRepository.findByMobile(mobile).orElse(new User());
        user.setMobile(mobile);
        user.setFullName(name);
        if (user.getEmail() == null) {
            user.setEmail(name.toLowerCase().replace(" ", ".") + "@fintech.com");
        }
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(role);
        user.setApprovalLimit(limit);
        user.setCustomerId("CIF" + mobile.substring(4));
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private void seedTierConfigs() {
        // Tier 1: <= 2L (System is the checker)
        TierConfig t1 = new TierConfig();
        t1.setTier(Tier.TIER_1);
        t1.setMinAmount(BigDecimal.ZERO);
        t1.setMaxAmount(new BigDecimal("200000"));
        t1.setRequiredCheckerRole(null); // No human checker
        t1.setAutoDecisionEnabled(true);
        t1.setSlaWorkingDays(0);
        tierConfigRepository.save(t1);

        // Tier 2: 2L < amount <= 10L (Branch Manager)
        TierConfig t2 = new TierConfig();
        t2.setTier(Tier.TIER_2);
        t2.setMinAmount(new BigDecimal("200000.01"));
        t2.setMaxAmount(new BigDecimal("1000000"));
        t2.setRequiredCheckerRole(UserRole.BRANCH_MANAGER);
        t2.setAutoDecisionEnabled(false);
        t2.setSlaWorkingDays(1);
        tierConfigRepository.save(t2);

        // Tier 3: 10L < amount <= 25L (Regional Credit Mgr + Zonal Head)
        TierConfig t3 = new TierConfig();
        t3.setTier(Tier.TIER_3);
        t3.setMinAmount(new BigDecimal("1000000.01"));
        t3.setMaxAmount(new BigDecimal("2500000"));
        t3.setRequiredCheckerRole(UserRole.REGIONAL_CREDIT_MGR);
        t3.setDualCheckerRequired(true);
        t3.setAutoDecisionEnabled(false);
        t3.setSlaWorkingDays(3);
        tierConfigRepository.save(t3);

        // Tier 4: > 25L (Credit Committee / BOD)
        TierConfig t4 = new TierConfig();
        t4.setTier(Tier.TIER_4);
        t4.setMinAmount(new BigDecimal("2500000.01"));
        t4.setMaxAmount(new BigDecimal("999999999"));
        t4.setRequiredCheckerRole(UserRole.CREDIT_COMMITTEE);
        t4.setAutoDecisionEnabled(false);
        t4.setSlaWorkingDays(5);
        tierConfigRepository.save(t4);
    }
}
