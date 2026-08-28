package com.petpulse.app.healthrecord.service;

import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.healthrecord.dto.HealthRecordStatus;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.entity.RiskGrade;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.ActivityLevel;
import com.petpulse.app.questionnaire.entity.AppetiteLevel;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.entity.SkinCondition;
import com.petpulse.app.questionnaire.entity.WaterIntakeLevel;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.report.repository.WeeklyReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthRecordServiceTest {

    @Mock PetAccessService petAccessService;
    @Mock QuestionnaireRepository questionnaireRepository;
    @Mock HealthPredictionRepository healthPredictionRepository;
    @Mock HealthAlertRepository healthAlertRepository;
    @Mock WeeklyReportRepository weeklyReportRepository;
    @Mock Pet pet;

    private HealthRecordService service;

    @BeforeEach
    void setUp() {
        service = new HealthRecordService(
                petAccessService,
                questionnaireRepository,
                healthPredictionRepository,
                healthAlertRepository,
                weeklyReportRepository);
    }

    @Test
    void questionnairesAndPredictionsAreCombinedInOnePagedRecord() {
        Questionnaire analyzed = questionnaire(1L, LocalDateTime.of(2026, 8, 28, 10, 0));
        Questionnaire pending = questionnaire(2L, LocalDateTime.of(2026, 8, 27, 10, 0));
        HealthPrediction prediction = prediction(10L, analyzed);

        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(questionnaireRepository.findByPetPetId(any(Long.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(analyzed, pending)));
        when(healthPredictionRepository.findByQuestionnaireQuestionnaireIdIn(List.of(1L, 2L)))
                .thenReturn(List.of(prediction));
        when(questionnaireRepository.countPendingByPetId(1L)).thenReturn(1L);

        var response = service.getHealthRecords(
                "guardian",
                1L,
                0,
                6,
                HealthRecordStatus.ALL);

        assertThat(response.content()).hasSize(2);
        assertThat(response.content().get(0).analyzed()).isTrue();
        assertThat(response.content().get(0).predictionId()).isEqualTo(10L);
        assertThat(response.content().get(1).analyzed()).isFalse();
        assertThat(response.content().get(1).predictionId()).isNull();
        assertThat(response.unanalyzedCount()).isEqualTo(1L);
    }

    @Test
    void deletingAnalyzedRecordAlsoDeletesLinkedDataAndAffectedReport() {
        Questionnaire questionnaire = questionnaire(
                1L,
                LocalDateTime.of(2026, 8, 28, 10, 0));
        HealthPrediction prediction = prediction(10L, questionnaire);

        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(1L, "guardian"))
                .thenReturn(Optional.of(questionnaire));
        when(healthPredictionRepository.findByQuestionnaireQuestionnaireId(1L))
                .thenReturn(Optional.of(prediction));
        when(pet.getPetId()).thenReturn(7L);

        service.deleteHealthRecord("guardian", 1L);

        InOrder deletionOrder = inOrder(
                healthAlertRepository,
                healthPredictionRepository,
                weeklyReportRepository,
                questionnaireRepository);
        deletionOrder.verify(healthAlertRepository).deleteByPredictionId(10L);
        deletionOrder.verify(healthPredictionRepository).deleteByQuestionnaireQuestionnaireId(1L);
        deletionOrder.verify(weeklyReportRepository).deleteContainingRecordDate(
                7L,
                questionnaire.getSubmittedAt().toLocalDate());
        deletionOrder.verify(questionnaireRepository).delete(questionnaire);
    }

    @Test
    void deletingPendingRecordDoesNotTryToDeletePredictionAlert() {
        Questionnaire questionnaire = questionnaire(
                1L,
                LocalDateTime.of(2026, 8, 28, 10, 0));

        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(1L, "guardian"))
                .thenReturn(Optional.of(questionnaire));
        when(healthPredictionRepository.findByQuestionnaireQuestionnaireId(1L))
                .thenReturn(Optional.empty());
        when(pet.getPetId()).thenReturn(7L);

        service.deleteHealthRecord("guardian", 1L);

        verify(healthPredictionRepository).deleteByQuestionnaireQuestionnaireId(1L);
        verify(weeklyReportRepository).deleteContainingRecordDate(
                7L,
                questionnaire.getSubmittedAt().toLocalDate());
        verify(questionnaireRepository).delete(questionnaire);
        org.mockito.Mockito.verifyNoInteractions(healthAlertRepository);
    }

    private Questionnaire questionnaire(
            Long questionnaireId,
            LocalDateTime submittedAt) {

        Questionnaire questionnaire = new Questionnaire(
                pet,
                BigDecimal.valueOf(38.4),
                92,
                24,
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

        ReflectionTestUtils.setField(questionnaire, "questionnaireId", questionnaireId);
        ReflectionTestUtils.setField(questionnaire, "submittedAt", submittedAt);
        return questionnaire;
    }

    private HealthPrediction prediction(
            Long predictionId,
            Questionnaire questionnaire) {

        HealthPrediction prediction = new HealthPrediction(
                questionnaire,
                BigDecimal.valueOf(0.2),
                RiskGrade.WATCH,
                "활동량 변화",
                null,
                "상태를 관찰해 주세요.",
                "1.0.0");

        ReflectionTestUtils.setField(prediction, "predictionId", predictionId);
        return prediction;
    }
}
