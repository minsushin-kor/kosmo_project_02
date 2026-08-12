package com.petpulse.app.prediction.service;

import com.petpulse.app.alert.entity.AlertSeverity;
import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.entity.HealthAlertType;
import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.dto.ai.AiExplainPredictionRequest;
import com.petpulse.app.prediction.dto.ai.AiExplainPredictionResponse;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthPredictionService {

        private final HealthPredictionRepository healthPredictionRepository;
        private final QuestionnaireRepository questionnaireRepository;
        private final FastApiHealthPredictionClient fastApiHealthPredictionClient;
        private final HealthAlertRepository healthAlertRepository;

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

                AiExplainPredictionRequest explainRequest = new AiExplainPredictionRequest(
                                pet.getSpecies().name(),
                                age,
                                aiResponse.riskGrade(),
                                aiResponse.abnormalProbability(),
                                aiResponse.primaryRiskFactor(),
                                questionnaire.getSymptomDurationDays(),
                                questionnaire.getAdditionalSymptoms());

                AiExplainPredictionResponse explainResponse = fastApiHealthPredictionClient
                                .explainPrediction(explainRequest);

                String aiSummary = buildAiSummary(explainResponse);

                HealthPrediction healthPrediction = new HealthPrediction(
                                questionnaire,
                                BigDecimal.valueOf(aiResponse.abnormalProbability()),
                                RiskGrade.valueOf(aiResponse.riskGrade()),
                                aiResponse.primaryRiskFactor(),
                                null,
                                aiSummary,
                                "1.0.0");

                HealthPrediction saved = healthPredictionRepository.save(healthPrediction);

                createPredictionAlertIfNeeded(
                                pet,
                                saved,
                                aiResponse);

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

        private void createPredictionAlertIfNeeded(
                        Pet pet,
                        HealthPrediction prediction,
                        AiHealthRiskResponse aiResponse) {

                RiskGrade riskGrade = RiskGrade.valueOf(aiResponse.riskGrade());

                if (riskGrade == RiskGrade.NORMAL) {
                        return;
                }

                AlertSeverity severity = AlertSeverity.valueOf(riskGrade.name());

                String title = switch (severity) {
                        case WATCH -> "건강 상태 관찰이 필요합니다.";
                        case CAUTION -> "건강 상태에 주의가 필요합니다.";
                        case DANGER -> "건강 위험 신호가 감지되었습니다.";
                };

                String message = buildAlertMessage(
                                aiResponse.primaryRiskFactor(),
                                severity);

                HealthAlert alert = new HealthAlert(
                                pet,
                                prediction,
                                HealthAlertType.PREDICTION,
                                severity,
                                title,
                                message);

                healthAlertRepository.save(alert);
        }

        private String buildAlertMessage(
                        String primaryRiskFactor,
                        AlertSeverity severity) {

                String riskFactor = primaryRiskFactor == null
                                || primaryRiskFactor.isBlank()
                                                ? "건강 이상 징후"
                                                : primaryRiskFactor;

                return switch (severity) {
                        case WATCH ->
                                riskFactor
                                                + " 관련 징후가 확인되었습니다. "
                                                + "상태 변화를 지속적으로 관찰해 주세요.";

                        case CAUTION ->
                                riskFactor
                                                + " 관련 주의가 필요한 징후가 확인되었습니다. "
                                                + "생체정보와 증상 변화를 다시 확인해 주세요.";

                        case DANGER ->
                                riskFactor
                                                + " 관련 위험 신호가 확인되었습니다. "
                                                + "상태가 지속되거나 악화되면 전문가 상담을 고려해 주세요.";
                };
        }

        private String buildAiSummary(
                        AiExplainPredictionResponse response) {

                String explanation = response.explanation();
                String advice = response.advice();

                if (explanation == null || explanation.isBlank()) {
                        return advice;
                }

                if (advice == null || advice.isBlank()) {
                        return explanation;
                }

                return explanation + "\n\n" + advice;
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