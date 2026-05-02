package com.fintech.los.common.audit.repository;

import com.fintech.los.common.audit.model.LoanAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanAuditLogRepository extends JpaRepository<LoanAuditLog, Long> {
    List<LoanAuditLog> findByApplicationIdOrderByTimestampDesc(Long applicationId);
    Optional<LoanAuditLog> findFirstByApplicationIdOrderByIdDesc(Long applicationId);
}
