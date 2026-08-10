package com.petpulse.app.prediction.dto;

import com.petpulse.app.prediction.entity.RiskGrade;

import java.math.BigDecimal;

public record HealthPredictionRequest(
        BigDecimal abnormalProbability,
        RiskGrade riskGrade,
        String primaryRiskFactor,
        String riskFactorsJson,
        String aiSummary,
        String modelVersion) {
}