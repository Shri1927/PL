package com.fintech.los.integration.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkflowEventPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;
    @Value("${app.kafka.topics.workflow-events}")
    private String workflowTopic;

    public void publish(String eventType, Long applicationId, String payload) {
        String message = "{\"eventType\":\"" + eventType + "\",\"applicationId\":" + applicationId + ",\"payload\":\"" + payload + "\"}";
        kafkaTemplate.send(workflowTopic, String.valueOf(applicationId), message);
    }
}
