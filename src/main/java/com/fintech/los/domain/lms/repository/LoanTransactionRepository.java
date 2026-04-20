package com.fintech.los.domain.lms.repository;

import com.fintech.los.domain.lms.LoanTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanTransactionRepository extends JpaRepository<LoanTransaction, Long> {
    List<LoanTransaction> findByApplicationIdOrderByEventTimeDesc(Long applicationId);
}
