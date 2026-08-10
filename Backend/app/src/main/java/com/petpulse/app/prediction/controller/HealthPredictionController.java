package com.petpulse.app.prediction.controller;

import com.petpulse.app.prediction.dto.HealthPredictionRequest;
import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.service.HealthPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class HealthPredictionController {

    private final HealthPredictionService healthPredictionService;

    @PostMapping("/api/questionnaires/{questionnaireId}/predictions")
    public ResponseEntity<HealthPredictionResponse> createPrediction(
            @PathVariable Long questionnaireId,
            @RequestBody HealthPredictionRequest request) {

        HealthPredictionResponse response = healthPredictionService.createPrediction(
                questionnaireId,
                request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/api/predictions/{predictionId}")
    public ResponseEntity<HealthPredictionResponse> getPrediction(
            @PathVariable Long predictionId) {

        return ResponseEntity.ok(
                healthPredictionService.getPrediction(predictionId));
    }

    @GetMapping("/api/questionnaires/{questionnaireId}/prediction")
    public ResponseEntity<HealthPredictionResponse> getPredictionByQuestionnaire(
            @PathVariable Long questionnaireId) {

        return ResponseEntity.ok(
                healthPredictionService
                        .getPredictionByQuestionnaire(questionnaireId));
    }
}