package com.fintech.los.domain.kyc;

import com.fintech.los.domain.loan.LoanEnums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "kyc_details")
public class KycDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private String pan;
    private String aadhaarToken;
    private boolean panVerified;
    private boolean aadhaarVerified;
    private boolean ckycFound;
    private boolean videoKycRequired;
    private boolean fraudFlag;
    private boolean amlFlag;
    @Enumerated(EnumType.STRING)
    private VerificationStatus status;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
