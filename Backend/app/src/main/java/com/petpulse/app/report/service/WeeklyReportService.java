package com.petpulse.app.report.service;

import com.petpulse.app.alert.entity.AlertSeverity;
import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.report.client.FastApiWeeklyReportClient;
import com.petpulse.app.report.dto.WeeklyReportResponse;
import com.petpulse.app.report.dto.ai.AiWeeklyReportRequest;
import com.petpulse.app.report.dto.ai.AiWeeklyReportResponse;
import com.petpulse.app.report.entity.WeeklyReport;
import com.petpulse.app.report.repository.WeeklyReportRepository;
import com.petpulse.app.vital.entity.VitalRecord;
import com.petpulse.app.vital.repository.VitalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WeeklyReportService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final PetRepository petRepository;
    private final VitalRecordRepository vitalRecordRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final HealthPredictionRepository healthPredictionRepository;
    private final HealthAlertRepository healthAlertRepository;
    private final FastApiWeeklyReportClient fastApiWeeklyReportClient;

    @Transactional
    public WeeklyReportResponse createWeeklyReport(Long petId) {

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 반려동물입니다. petId=" + petId));

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate
                .plusDays(1)
                .atStartOfDay()
                .minusNanos(1);

        List<VitalRecord> vitals = vitalRecordRepository
                .findByPetPetIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                        petId,
                        startDateTime,
                        endDateTime);

        List<Questionnaire> questionnaires = questionnaireRepository
                .findByPetPetIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
                        petId,
                        startDateTime,
                        endDateTime);

        List<HealthPrediction> predictions = healthPredictionRepository
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        petId,
                        startDateTime,
                        endDateTime);

        List<HealthAlert> alerts = healthAlertRepository
                .findByPetPetIdAndCreatedAtBetween(
                        petId,
                        startDateTime,
                        endDateTime);

        double avgTemperature = vitals.stream()
                .mapToDouble(vital -> vital.getTemperature().doubleValue())
                .average()
                .orElse(0.0);

        double avgHeartRate = vitals.stream()
                .mapToInt(VitalRecord::getHeartRate)
                .average()
                .orElse(0.0);

        double avgRespiratoryRate = vitals.stream()
                .mapToInt(VitalRecord::getRespiratoryRate)
                .average()
                .orElse(0.0);

        int cautionAlertCount = (int) alerts.stream()
                .filter(alert -> alert.getSeverity() == AlertSeverity.CAUTION)
                .count();

        int dangerAlertCount = (int) alerts.stream()
                .filter(alert -> alert.getSeverity() == AlertSeverity.DANGER)
                .count();

        double averageRiskProbability = predictions.stream()
                .mapToDouble(prediction -> prediction.getAbnormalProbability().doubleValue())
                .average()
                .orElse(0.0);

        String mainSymptomsSummary = buildMainSymptomsSummary(
                questionnaires,
                predictions);

        AiWeeklyReportRequest aiRequest = new AiWeeklyReportRequest(
                pet.getPetName(),
                pet.getSpecies().name(),
                calculateAge(pet),
                avgTemperature,
                avgHeartRate,
                avgRespiratoryRate,
                cautionAlertCount,
                dangerAlertCount,
                questionnaires.size(),
                mainSymptomsSummary);

        AiWeeklyReportResponse aiResponse = fastApiWeeklyReportClient
                .generateWeeklyReport(aiRequest);

        WeeklyReport weeklyReport = new WeeklyReport(
                pet,
                startDate,
                endDate,
                toBigDecimal(avgTemperature, 1),
                toBigDecimal(avgHeartRate, 2),
                cautionAlertCount,
                dangerAlertCount,
                questionnaires.size(),
                toBigDecimal(averageRiskProbability, 4),
                aiResponse.oneLineSummary(),
                aiResponse.reportContent());

        WeeklyReport saved = weeklyReportRepository.save(weeklyReport);

        return WeeklyReportResponse.from(saved);
    }

    private String buildMainSymptomsSummary(
            List<Questionnaire> questionnaires,
            List<HealthPrediction> predictions) {

        String symptoms = questionnaires.stream()
                .map(Questionnaire::getAdditionalSymptoms)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));

        String riskFactors = predictions.stream()
                .map(HealthPrediction::getPrimaryRiskFactor)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));

        if (!symptoms.isBlank() && !riskFactors.isBlank()) {
            return "주요 증상: "
                    + symptoms
                    + " / 주요 위험 요인: "
                    + riskFactors;
        }

        if (!symptoms.isBlank()) {
            return "주요 증상: " + symptoms;
        }

        if (!riskFactors.isBlank()) {
            return "주요 위험 요인: " + riskFactors;
        }

        return "특이 증상 기록 없음";
    }

    private BigDecimal toBigDecimal(
            double value,
            int scale) {

        return BigDecimal.valueOf(value)
                .setScale(scale, RoundingMode.HALF_UP);
    }

    private int calculateAge(Pet pet) {

        if (pet.getBirthDate() == null) {
            return 0;
        }

        return Period.between(
                pet.getBirthDate(),
                LocalDate.now())
                .getYears();
    }

    public List<WeeklyReportResponse> getWeeklyReports(
            Long petId) {

        if (!petRepository.existsById(petId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 반려동물입니다. petId=" + petId);
        }

        return weeklyReportRepository
                .findByPetPetIdOrderByCreatedAtDesc(petId)
                .stream()
                .map(WeeklyReportResponse::from)
                .toList();
    }

    public WeeklyReportResponse getWeeklyReport(
            Long reportId) {

        WeeklyReport report = weeklyReportRepository
                .findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 주간 리포트입니다. reportId="
                                + reportId));

        return WeeklyReportResponse.from(report);
    }
}