package com.petpulse.app.questionnaire.dto;

import com.petpulse.app.questionnaire.entity.ActivityLevel;
import com.petpulse.app.questionnaire.entity.AppetiteLevel;
import com.petpulse.app.questionnaire.entity.SkinCondition;
import com.petpulse.app.questionnaire.entity.WaterIntakeLevel;

import java.math.BigDecimal;

public record QuestionnaireRequest(
        BigDecimal temperature,
        Integer heartRate,
        Integer respiratoryRate,
        SkinCondition skinCondition,
        Boolean itching,
        Boolean hairLoss,
        Boolean vomiting,
        Boolean diarrhea,
        AppetiteLevel appetiteLevel,
        WaterIntakeLevel waterIntakeLevel,
        ActivityLevel activityLevel,
        Integer symptomDurationDays,
        String additionalSymptoms) {
}