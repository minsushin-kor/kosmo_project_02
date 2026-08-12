package com.petpulse.app.prediction.service;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.entity.RiskGrade;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthPredictionService {

        private final HealthPredictionRepository healthPredictionRepository;
        private final QuestionnaireRepository questionnaireRepository;
        private final FastApiHealthPredictionClient fastApiHealthPredictionClient;

        @Transactional
        public HealthPredictionResponse createPrediction(Long questionnaireId) {

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

                Pet pet = questionnaire.getPet();

                int age = calculateAge(pet);

                boolean skinRedness = questionnaire.getSkinCondition() != null
                                && "REDNESS".equals(
                                                questionnaire.getSkinCondition().name());

                AiHealthRiskRequest aiRequest = new AiHealthRiskRequest(
                                pet.getSpecies().name(),
                                age,
                                pet.getWeight() != null
                                                ? pet.getWeight().doubleValue()
                                                : null,
                                questionnaire.getTemperature().doubleValue(),
                                questionnaire.getHeartRate(),
                                questionnaire.getRespiratoryRate(),
                                skinRedness,
                                questionnaire.getItching(),
                                questionnaire.getHairLoss(),
                                questionnaire.getVomiting(),
                                questionnaire.getDiarrhea(),
                                questionnaire.getAppetiteLevel().name(),
                                questionnaire.getWaterIntakeLevel().name(),
                                questionnaire.getActivityLevel().name(),
                                questionnaire.getSymptomDurationDays());

                AiHealthRiskResponse aiResponse = fastApiHealthPredictionClient.predictHealthRisk(aiRequest);

                HealthPrediction healthPrediction = new HealthPrediction(
                                questionnaire,
                                BigDecimal.valueOf(aiResponse.abnormalProbability()),
                                RiskGrade.valueOf(aiResponse.riskGrade()),
                                aiResponse.primaryRiskFactor(),
                                null,
                                null,
                                "1.0.0");

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

        private int calculateAge(Pet pet) {

                if (pet.getBirthDate() == null) {
                        return 0;
                }

                return Period.between(
                                pet.getBirthDate(),
                                LocalDate.now()).getYears();
        }
}