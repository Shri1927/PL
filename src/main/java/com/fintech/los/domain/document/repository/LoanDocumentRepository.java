package com.fintech.los.domain.document.repository;

import com.fintech.los.domain.document.LoanDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long> {
    List<LoanDocument> findByApplicationId(Long applicationId);
}
