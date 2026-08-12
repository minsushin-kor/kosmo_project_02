package com.petpulse.app.prediction.dto.ai;

public record AiHealthRiskRequest(

        String species,

        Integer age,

        Double weight,

        Double temperature,

        Integer heartRate,

        Integer respiratoryRate,

        Boolean skinRedness,

        Boolean itching,

        Boolean hairLoss,

        Boolean vomiting,

        Boolean diarrhea,

        String appetiteLevel,

        String waterIntakeLevel,

        String activityLevel,

        Integer symptomDurationDays) {
}