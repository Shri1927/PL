package com.fintech.los.domain.underwriter;

import com.fintech.los.domain.loan.LoanEnums.Decision;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "underwriter_reviews")
public class UnderwriterReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long applicationId;
    private Long underwriterId;
    @Enumerated(EnumType.STRING)
    private Decision action;
    private String commentText;
    private LocalDateTime slaDueAt;
    private LocalDateTime createdAt;
}
