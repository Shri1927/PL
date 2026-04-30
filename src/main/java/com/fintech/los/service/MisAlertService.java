package com.fintech.los.service;

import com.fintech.los.domain.loan.LoanApplication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MisAlertService {

    public void sendTier1Alert(LoanApplication application) {
        log.info("MIS ALERT: Tier 1 Loan Auto-Approved. ID: {}, Amount: {}, Customer: {}", 
                application.getId(), application.getRequestedAmount(), application.getUserId());
        // Logic to send MIS report/alert to Branch Manager
    }
}
