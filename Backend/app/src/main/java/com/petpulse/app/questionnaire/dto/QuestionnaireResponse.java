package com.petpulse.app.questionnaire.dto;

import com.petpulse.app.questionnaire.entity.ActivityLevel;
import com.petpulse.app.questionnaire.entity.AppetiteLevel;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.entity.SkinCondition;
import com.petpulse.app.questionnaire.entity.WaterIntakeLevel;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QuestionnaireResponse(
        Long questionnaireId,
        Long petId,
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
        String additionalSymptoms,
        LocalDateTime submittedAt) {

    public static QuestionnaireResponse from(Questionnaire questionnaire) {
        return new QuestionnaireResponse(
                questionnaire.getQuestionnaireId(),
                questionnaire.getPet().getPetId(),
                questionnaire.getTemperature(),
                questionnaire.getHeartRate(),
                questionnaire.getRespiratoryRate(),
                questionnaire.getSkinCondition(),
                questionnaire.getItching(),
                questionnaire.getHairLoss(),
                questionnaire.getVomiting(),
                questionnaire.getDiarrhea(),
                questionnaire.getAppetiteLevel(),
                questionnaire.getWaterIntakeLevel(),
                questionnaire.getActivityLevel(),
                questionnaire.getSymptomDurationDays(),
                questionnaire.getAdditionalSymptoms(),
                questionnaire.getSubmittedAt());
    }
}