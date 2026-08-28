package com.petpulse.app.healthrecord.dto;

import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;

public record HealthRecordDetailResponse(
        QuestionnaireResponse questionnaire,
        HealthPredictionResponse prediction) {
}
