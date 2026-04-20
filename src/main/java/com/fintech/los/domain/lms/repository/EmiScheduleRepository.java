package com.fintech.los.domain.lms.repository;

import com.fintech.los.domain.lms.EmiSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmiScheduleRepository extends JpaRepository<EmiSchedule, Long> {
    List<EmiSchedule> findByApplicationIdOrderByInstallmentNo(Long applicationId);
}
