package com.petpulse.app.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record FoodRecommendationRequest(
        String petName,
        @NotBlank String species,
        @Min(0) @Max(30) int age,
        @Positive Double weight,
        String healthConcerns,
        String currentFoodType,
        String additionalNotes) {
}
