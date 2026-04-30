package com.fintech.los.domain.loan.repository;

import com.fintech.los.domain.loan.ApprovalTask;
import com.fintech.los.domain.loan.LoanEnums.TaskStatus;
import com.fintech.los.domain.loan.LoanEnums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalTaskRepository extends JpaRepository<ApprovalTask, Long> {
    List<ApprovalTask> findByApplicationId(Long applicationId);
    List<ApprovalTask> findByAssignedToAndStatus(Long assignedTo, TaskStatus status);
    
    @Query("SELECT t FROM ApprovalTask t WHERE t.status = :status AND (t.assignedRole = :role OR t.assignedTo = :userId)")
    List<ApprovalTask> findByStatusAndAssignedRoleOrAssignedTo(TaskStatus status, UserRole role, Long userId);

    Optional<ApprovalTask> findFirstByApplicationIdOrderByIdDesc(Long applicationId);
}
