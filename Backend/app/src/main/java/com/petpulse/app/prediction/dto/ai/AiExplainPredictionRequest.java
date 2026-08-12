package com.petpulse.app.prediction.dto.ai;

public record AiExplainPredictionRequest(
        String species,
        int age,
        String riskGrade,
        double abnormalProbability,
        String primaryRiskFactor,
        int symptomDurationDays,
        String additionalSymptoms) {
}