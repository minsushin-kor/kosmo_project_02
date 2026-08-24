package com.petpulse.app.ai.controller;

import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.ai.service.AiGatewayService;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai")
public class AiGatewayController {
    private final AiGatewayService aiGatewayService;

    @PostMapping("/quick-predictions")
    public ResponseEntity<AiHealthRiskResponse> quickPrediction(
            @Valid @RequestBody AiHealthRiskRequest request) {
        return ResponseEntity.ok(aiGatewayService.quickPrediction(request));
    }

    @PostMapping("/food-recommendations")
    public ResponseEntity<FoodRecommendationResponse> foodRecommendation(
            @Valid @RequestBody FoodRecommendationRequest request) {
        return ResponseEntity.ok(aiGatewayService.foodRecommendation(request));
    }
}
