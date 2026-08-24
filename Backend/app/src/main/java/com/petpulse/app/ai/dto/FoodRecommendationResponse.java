package com.petpulse.app.ai.dto;

import java.util.List;

public record FoodRecommendationResponse(
        String petSummary,
        List<RecommendedIngredient> recommendedIngredients,
        List<String> avoidIngredients,
        List<String> feedingTips,
        String vetNote) {
    public record RecommendedIngredient(String name, String reason) {
    }
}
