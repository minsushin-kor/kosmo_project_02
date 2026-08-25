package com.petpulse.app.ai.controller;

import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.ai.dto.ChatStreamRequest;
import com.petpulse.app.ai.service.AiGatewayService;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai")
public class AiGatewayController {
    private static final MediaType SSE_UTF8 = MediaType.parseMediaType("text/event-stream;charset=UTF-8");

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

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> chatStream(
            @Valid @RequestBody ChatStreamRequest request) {
        return ResponseEntity.ok()
                .contentType(SSE_UTF8)
                .cacheControl(CacheControl.noCache())
                .header("X-Accel-Buffering", "no")
                .body(aiGatewayService.chatStream(request));
    }
}
