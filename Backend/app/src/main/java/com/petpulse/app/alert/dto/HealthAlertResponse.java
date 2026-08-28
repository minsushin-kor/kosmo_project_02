package com.petpulse.app.alert.dto;

import com.petpulse.app.alert.entity.HealthAlert;

import java.time.LocalDateTime;

public record HealthAlertResponse(
        Long alertId,
        Long petId,
        Long predictionId,
        Long questionnaireId,
        String alertType,
        String severity,
        String title,
        String message,
        boolean isRead,
        LocalDateTime createdAt) {

    public static HealthAlertResponse from(HealthAlert alert) {

        return new HealthAlertResponse(
                alert.getAlertId(),
                alert.getPet().getPetId(),
                alert.getPrediction() != null
                        ? alert.getPrediction().getPredictionId()
                        : null,
                alert.getPrediction() != null
                        ? alert.getPrediction().getQuestionnaire().getQuestionnaireId()
                        : null,
                alert.getAlertType().name(),
                alert.getSeverity().name(),
                alert.getTitle(),
                alert.getMessage(),
                alert.isRead(),
                alert.getCreatedAt());
    }
}
