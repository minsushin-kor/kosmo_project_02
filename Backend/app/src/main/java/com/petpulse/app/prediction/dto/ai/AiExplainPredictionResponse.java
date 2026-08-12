package com.petpulse.app.prediction.dto.ai;

import java.util.List;

public record AiExplainPredictionResponse(
        String explanation,
        List<String> checkpoints,
        String advice) {
}