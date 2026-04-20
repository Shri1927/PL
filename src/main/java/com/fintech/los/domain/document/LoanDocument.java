package com.fintech.los.domain.document;

import com.fintech.los.domain.loan.LoanEnums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "loan_documents")
public class LoanDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private String documentType;
    private String storageUrl;
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;
    @Column(columnDefinition = "TEXT")
    private String ocrPayload;
    private BigDecimal qualityScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
