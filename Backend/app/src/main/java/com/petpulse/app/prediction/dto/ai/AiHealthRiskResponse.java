package com.petpulse.app.prediction.dto.ai;

public record AiHealthRiskResponse(

        Double abnormalProbability,

        String riskGrade,

        String primaryRiskFactor) {
}