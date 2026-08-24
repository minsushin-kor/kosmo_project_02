package com.petpulse.app.ai.service;

import com.petpulse.app.ai.client.FastApiFoodRecommendationClient;
import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiGatewayService {
    private final FastApiHealthPredictionClient healthPredictionClient;
    private final FastApiFoodRecommendationClient foodRecommendationClient;

    public AiHealthRiskResponse quickPrediction(AiHealthRiskRequest request) {
        return healthPredictionClient.predictHealthRisk(request);
    }

    public FoodRecommendationResponse foodRecommendation(FoodRecommendationRequest request) {
        return foodRecommendationClient.recommend(request);
    }
}
