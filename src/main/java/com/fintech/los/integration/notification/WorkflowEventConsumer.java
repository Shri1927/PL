package com.fintech.los.integration.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowEventConsumer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "${app.kafka.topics.workflow-events}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(String message) {
        processWithRetry(message, 0);
    }

    private void processWithRetry(String message, int attempt) {
        try {
            // Placeholder for downstream processing.
            log.info("Workflow event consumed: {}", message);
        } catch (Exception ex) {
            if (attempt >= 2) {
                kafkaTemplate.send("loan-workflow-events-dlq", message);
                log.error("Event pushed to DLQ after retries: {}", message, ex);
                return;
            }
            processWithRetry(message, attempt + 1);
        }
    }
}
