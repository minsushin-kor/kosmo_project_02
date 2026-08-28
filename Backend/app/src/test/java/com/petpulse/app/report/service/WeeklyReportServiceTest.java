package com.petpulse.app.report.service;

import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.ActivityLevel;
import com.petpulse.app.questionnaire.entity.AppetiteLevel;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.entity.SkinCondition;
import com.petpulse.app.questionnaire.entity.WaterIntakeLevel;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.report.client.FastApiWeeklyReportClient;
import com.petpulse.app.report.dto.ai.AiWeeklyReportRequest;
import com.petpulse.app.report.dto.ai.AiWeeklyReportResponse;
import com.petpulse.app.report.entity.WeeklyReport;
import com.petpulse.app.report.repository.WeeklyReportRepository;
import com.petpulse.app.vital.entity.VitalRecord;
import com.petpulse.app.vital.repository.VitalRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeeklyReportServiceTest {

    @Mock WeeklyReportRepository weeklyReportRepository;
    @Mock PetAccessService petAccessService;
    @Mock VitalRecordRepository vitalRecordRepository;
    @Mock QuestionnaireRepository questionnaireRepository;
    @Mock HealthPredictionRepository healthPredictionRepository;
    @Mock HealthAlertRepository healthAlertRepository;
    @Mock FastApiWeeklyReportClient fastApiWeeklyReportClient;
    @Mock Pet pet;

    private WeeklyReportService service;

    @BeforeEach
    void setUp() {
        service = new WeeklyReportService(
                weeklyReportRepository,
                petAccessService,
                vitalRecordRepository,
                questionnaireRepository,
                healthPredictionRepository,
                healthAlertRepository,
                fastApiWeeklyReportClient);

        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(pet.getPetId()).thenReturn(1L);
        when(pet.getPetName()).thenReturn("초코");
        when(pet.getSpecies()).thenReturn(PetSpecies.DOG);
        when(pet.getBirthDate()).thenReturn(LocalDate.now().minusYears(3));
        when(weeklyReportRepository.existsByPetPetIdAndStartDateAndEndDate(
                anyLong(), any(LocalDate.class), any(LocalDate.class))).thenReturn(false);
        when(healthPredictionRepository.findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(healthAlertRepository.findByPetPetIdAndCreatedAtBetween(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(fastApiWeeklyReportClient.generateWeeklyReport(any(AiWeeklyReportRequest.class)))
                .thenReturn(new AiWeeklyReportResponse(
                        "주간 리포트",
                        "주간 요약",
                        "주간 내용",
                        List.of()));
        when(weeklyReportRepository.save(any(WeeklyReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void noRecordedValuesAreSavedAsNullInsteadOfZero() {
        when(vitalRecordRepository.findByPetPetIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(questionnaireRepository.findByPetPetIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());

        var response = service.createWeeklyReport("guardian", 1L);

        assertThat(response.averageTemperature()).isNull();
        assertThat(response.averageHeartRate()).isNull();
        assertThat(response.averageRiskProbability()).isNull();

        ArgumentCaptor<AiWeeklyReportRequest> requestCaptor =
                ArgumentCaptor.forClass(AiWeeklyReportRequest.class);
        verify(fastApiWeeklyReportClient).generateWeeklyReport(requestCaptor.capture());
        assertThat(requestCaptor.getValue().avgTemperature()).isNull();
        assertThat(requestCaptor.getValue().avgHeartRate()).isNull();
        assertThat(requestCaptor.getValue().avgRespiratoryRate()).isNull();
        assertThat(requestCaptor.getValue().averageRiskProbability()).isNull();
    }

    @Test
    void questionnaireValuesAreAveragedWithoutAddingMissingDaysAsZero() {
        Questionnaire first = questionnaire(38.0, 80, 20);
        Questionnaire second = questionnaire(39.0, 100, 30);
        VitalRecord legacyVital = mock(VitalRecord.class);

        when(questionnaireRepository.findByPetPetIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(first, second));
        when(vitalRecordRepository.findByPetPetIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(legacyVital));

        var response = service.createWeeklyReport("guardian", 1L);

        assertThat(response.averageTemperature()).isEqualByComparingTo("38.5");
        assertThat(response.averageHeartRate()).isEqualByComparingTo("90.00");
        assertThat(response.questionnaireCount()).isEqualTo(2);

        ArgumentCaptor<AiWeeklyReportRequest> requestCaptor =
                ArgumentCaptor.forClass(AiWeeklyReportRequest.class);
        verify(fastApiWeeklyReportClient).generateWeeklyReport(requestCaptor.capture());
        assertThat(requestCaptor.getValue().avgTemperature()).isEqualTo(38.5);
        assertThat(requestCaptor.getValue().avgHeartRate()).isEqualTo(90.0);
        assertThat(requestCaptor.getValue().avgRespiratoryRate()).isEqualTo(25.0);
    }

    private Questionnaire questionnaire(
            double temperature,
            int heartRate,
            int respiratoryRate) {

        return new Questionnaire(
                pet,
                BigDecimal.valueOf(temperature),
                heartRate,
                respiratoryRate,
                SkinCondition.NORMAL,
                false,
                false,
                false,
                false,
                AppetiteLevel.NORMAL,
                WaterIntakeLevel.NORMAL,
                ActivityLevel.NORMAL,
                0,
                null);
    }
}
