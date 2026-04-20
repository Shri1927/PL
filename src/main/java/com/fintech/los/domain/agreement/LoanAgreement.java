package com.fintech.los.domain.agreement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "loan_agreements")
public class LoanAgreement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private String agreementHash;
    private boolean signed;
    private LocalDateTime signedAt;
    private String signedDocumentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
