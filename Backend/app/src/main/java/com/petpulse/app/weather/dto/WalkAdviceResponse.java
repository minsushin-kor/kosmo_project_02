package com.petpulse.app.weather.dto;

public record WalkAdviceResponse(
        Long petId,
        String condition,
        int recommendationScore,
        String location,
        String locationSource,
        String observedAt,
        double temperature,
        int precipitationProbability,
        double precipitationAmount,
        double windSpeed,
        String airQualityLabel,
        Integer pm10,
        Integer pm25,
        String recommendationReason) {
}
