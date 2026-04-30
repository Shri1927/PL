package com.fintech.los.service;

import com.fintech.los.domain.loan.LoanApplication;
import com.fintech.los.domain.loan.LoanEnums.ApplicationStatus;
import com.fintech.los.domain.loan.repository.LoanApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaMonitorService {

    private final LoanApplicationRepository applicationRepository;

    @Scheduled(fixedRate = 900000) // Every 15 minutes
    public void monitorSla() {
        log.info("Running SLA Monitoring Job at {}", LocalDateTime.now());
        
        List<LoanApplication> pendingApplications = applicationRepository.findAllByStatus(ApplicationStatus.SUBMITTED);
        // Also check UNDER_REVIEW
        pendingApplications.addAll(applicationRepository.findAllByStatus(ApplicationStatus.UNDER_REVIEW));

        for (LoanApplication app : pendingApplications) {
            checkSla(app);
        }
    }

    private void checkSla(LoanApplication app) {
        if (app.getSlaDeadline() == null) return;

        LocalDateTime now = LocalDateTime.now();
        long totalSlaMinutes = ChronoUnit.MINUTES.between(app.getSubmittedAt(), app.getSlaDeadline());
        long elapsedMinutes = ChronoUnit.MINUTES.between(app.getSubmittedAt(), now);

        double elapsedPercent = (double) elapsedMinutes / totalSlaMinutes * 100;

        if (elapsedPercent >= 100) {
            escalate(app);
        } else if (elapsedPercent >= 75) {
            sendAmberAlert(app);
        }
    }

    private void sendAmberAlert(LoanApplication app) {
        log.warn("AMBER ALERT: SLA at 75% for Application ID: {}. Deadline: {}", app.getId(), app.getSlaDeadline());
        // Integration with notification service would go here
    }

    private void escalate(LoanApplication app) {
        log.error("SLA BREACH: Escalating Application ID: {}. Deadline was: {}", app.getId(), app.getSlaDeadline());
        // Logic to notify line manager and move to ESCALATED status if needed
    }
}
