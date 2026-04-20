package com.fintech.los.domain.disbursement;

import com.fintech.los.domain.loan.LoanEnums.DisbursementStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "disbursements")
public class Disbursement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private String bankAccount;
    private String ifsc;
    @Enumerated(EnumType.STRING)
    private DisbursementStatus status;
    private String utr;
    private BigDecimal amount;
    private LocalDateTime disbursedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
