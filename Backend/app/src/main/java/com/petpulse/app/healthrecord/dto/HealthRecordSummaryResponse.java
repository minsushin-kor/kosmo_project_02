package com.petpulse.app.healthrecord.dto;

import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.entity.RiskGrade;
import com.petpulse.app.questionnaire.entity.Questionnaire;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HealthRecordSummaryResponse(
        Long questionnaireId,
        LocalDateTime submittedAt,
        BigDecimal temperature,
        Integer heartRate,
        Integer respiratoryRate,
        String additionalSymptoms,
        boolean analyzed,
        Long predictionId,
        RiskGrade riskGrade,
        BigDecimal abnormalProbability) {

    public static HealthRecordSummaryResponse from(
            Questionnaire questionnaire,
            HealthPrediction prediction) {

        return new HealthRecordSummaryResponse(
                questionnaire.getQuestionnaireId(),
                questionnaire.getSubmittedAt(),
                questionnaire.getTemperature(),
                questionnaire.getHeartRate(),
                questionnaire.getRespiratoryRate(),
                questionnaire.getAdditionalSymptoms(),
                prediction != null,
                prediction != null ? prediction.getPredictionId() : null,
                prediction != null ? prediction.getRiskGrade() : null,
                prediction != null ? prediction.getAbnormalProbability() : null);
    }
}
