package com.petpulse.app.prediction.dto.ai;

import jakarta.validation.constraints.*;

public record AiHealthRiskRequest(

        @NotBlank String species,

        @NotNull @Min(0) @Max(30) Integer age,

        @NotNull @DecimalMin("0.1") @DecimalMax("100.0") Double weight,

        @NotNull @DecimalMin("30.0") @DecimalMax("45.0") Double temperature,

        @NotNull @Min(30) @Max(300) Integer heartRate,

        @NotNull @Min(5) @Max(100) Integer respiratoryRate,

        Boolean skinRedness,

        Boolean itching,

        Boolean hairLoss,

        Boolean vomiting,

        Boolean diarrhea,

        @NotBlank String appetiteLevel,

        @NotBlank String waterIntakeLevel,

        @NotBlank String activityLevel,

        @NotNull @Min(0) Integer symptomDurationDays) {
}
