package com.fintech.los.domain.auth.repository;

import com.fintech.los.domain.auth.User;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByMobile(String mobile);
    Optional<User> findByEmail(String email);
    List<User> findByRole(UserRole role);
}
