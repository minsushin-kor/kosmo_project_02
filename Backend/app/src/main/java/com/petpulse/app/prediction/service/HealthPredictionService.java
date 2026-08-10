package com.petpulse.app.prediction.service;

import com.petpulse.app.prediction.dto.HealthPredictionRequest;
import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthPredictionService {

    private final HealthPredictionRepository healthPredictionRepository;
    private final QuestionnaireRepository questionnaireRepository;

    @Transactional
    public HealthPredictionResponse createPrediction(
            Long questionnaireId,
            HealthPredictionRequest request) {

        Questionnaire questionnaire = questionnaireRepository
                .findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 문진입니다. questionnaireId="
                                + questionnaireId));

        if (healthPredictionRepository
                .existsByQuestionnaireQuestionnaireId(questionnaireId)) {

            throw new IllegalStateException(
                    "이미 예측 결과가 존재하는 문진입니다. questionnaireId="
                            + questionnaireId);
        }

        HealthPrediction healthPrediction = new HealthPrediction(
                questionnaire,
                request.abnormalProbability(),
                request.riskGrade(),
                request.primaryRiskFactor(),
                request.riskFactorsJson(),
                request.aiSummary(),
                request.modelVersion());

        HealthPrediction saved = healthPredictionRepository.save(healthPrediction);

        return HealthPredictionResponse.from(saved);
    }

    public HealthPredictionResponse getPrediction(Long predictionId) {

        HealthPrediction healthPrediction = healthPredictionRepository.findById(predictionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 예측 결과입니다. predictionId="
                                + predictionId));

        return HealthPredictionResponse.from(healthPrediction);
    }

    public HealthPredictionResponse getPredictionByQuestionnaire(
            Long questionnaireId) {

        HealthPrediction healthPrediction = healthPredictionRepository
                .findByQuestionnaireQuestionnaireId(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "해당 문진의 예측 결과가 존재하지 않습니다. questionnaireId="
                                + questionnaireId));

        return HealthPredictionResponse.from(healthPrediction);
    }
}