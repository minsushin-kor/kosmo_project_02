package com.petpulse.app.prediction.dto;

import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.entity.RiskGrade;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HealthPredictionResponse(
        Long predictionId,
        Long questionnaireId,
        BigDecimal abnormalProbability,
        RiskGrade riskGrade,
        String primaryRiskFactor,
        String riskFactorsJson,
        String aiSummary,
        String modelVersion,
        LocalDateTime predictedAt) {

    public static HealthPredictionResponse from(
            HealthPrediction healthPrediction) {

        return new HealthPredictionResponse(
                healthPrediction.getPredictionId(),
                healthPrediction.getQuestionnaire()
                        .getQuestionnaireId(),
                healthPrediction.getAbnormalProbability(),
                healthPrediction.getRiskGrade(),
                healthPrediction.getPrimaryRiskFactor(),
                healthPrediction.getRiskFactorsJson(),
                healthPrediction.getAiSummary(),
                healthPrediction.getModelVersion(),
                healthPrediction.getPredictedAt());
    }
}