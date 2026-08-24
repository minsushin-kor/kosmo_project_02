package com.petpulse.app.prediction.controller;

import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.service.HealthPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class HealthPredictionController {

        private final HealthPredictionService healthPredictionService;

        @PostMapping("/api/questionnaires/{questionnaireId}/predictions")
        public ResponseEntity<HealthPredictionResponse> createPrediction(
                        Authentication authentication,
                        @PathVariable Long questionnaireId) {

                HealthPredictionResponse response = healthPredictionService.createPrediction(authentication.getName(), questionnaireId);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/api/predictions/{predictionId}")
        public ResponseEntity<HealthPredictionResponse> getPrediction(
                        Authentication authentication,
                        @PathVariable Long predictionId) {

                return ResponseEntity.ok(
                                healthPredictionService.getPrediction(authentication.getName(), predictionId));
        }

        @GetMapping("/api/questionnaires/{questionnaireId}/prediction")
        public ResponseEntity<HealthPredictionResponse> getPredictionByQuestionnaire(
                        Authentication authentication,
                        @PathVariable Long questionnaireId) {

                return ResponseEntity.ok(
                                healthPredictionService
                                                .getPredictionByQuestionnaire(authentication.getName(), questionnaireId));
        }

        @GetMapping("/api/pets/{petId}/predictions")
        public ResponseEntity<List<HealthPredictionResponse>> getMonthlyPredictions(
                        Authentication authentication,
                        @PathVariable Long petId,
                        @RequestParam(required = false) Integer year,
                        @RequestParam(required = false) Integer month) {

                if (year == null && month == null) {
                        return ResponseEntity.ok(
                                        healthPredictionService.getPredictions(
                                                        authentication.getName(), petId));
                }

                if (year == null || month == null) {
                        throw new com.petpulse.app.global.exception.BusinessException(
                                        com.petpulse.app.global.exception.ErrorCode.INVALID_REQUEST,
                                        "year와 month는 함께 입력해야 합니다.");
                }

                return ResponseEntity.ok(
                                healthPredictionService.getMonthlyPredictions(
                                                authentication.getName(), petId,
                                                year,
                                                month));
        }
}
