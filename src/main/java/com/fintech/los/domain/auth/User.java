package com.fintech.los.domain.auth;

import com.fintech.los.domain.loan.LoanEnums.EmploymentType;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String customerId;
    private String mobile;
    private String email;
    private String passwordHash;
    private String fullName;
    @Enumerated(EnumType.STRING)
    private UserRole role;
    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;
    private java.math.BigDecimal approvalLimit;
    private String city;
    private LocalDate dob;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
