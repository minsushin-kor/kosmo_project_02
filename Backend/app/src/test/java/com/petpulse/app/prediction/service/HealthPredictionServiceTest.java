package com.petpulse.app.prediction.service;

import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthPredictionServiceTest {

    @Mock
    private HealthPredictionRepository healthPredictionRepository;
    @Mock
    private QuestionnaireRepository questionnaireRepository;
    @Mock
    private FastApiHealthPredictionClient fastApiHealthPredictionClient;
    @Mock
    private HealthAlertRepository healthAlertRepository;
    @Mock
    private PetRepository petRepository;

    private HealthPredictionService healthPredictionService;

    @BeforeEach
    void setUp() {
        healthPredictionService = new HealthPredictionService(
                healthPredictionRepository,
                questionnaireRepository,
                fastApiHealthPredictionClient,
                healthAlertRepository,
                petRepository);
    }

    @Test
    void monthlyPredictionsUseWholeMonthAndReturnEmptyList() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 8, 31, 23, 59, 59, 999_999_999);

        when(petRepository.existsById(1L)).thenReturn(true);
        when(healthPredictionRepository
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        1L,
                        start,
                        end))
                .thenReturn(List.of());

        assertThat(healthPredictionService.getMonthlyPredictions(1L, 2026, 8))
                .isEmpty();

        verify(healthPredictionRepository)
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        1L,
                        start,
                        end);
    }

    @Test
    void monthlyPredictionsUseRequestedPetIdAndExactMonthRange() {
        LocalDateTime start = LocalDateTime.of(2026, 2, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 2, 28, 23, 59, 59, 999_999_999);

        when(petRepository.existsById(2L)).thenReturn(true);
        when(healthPredictionRepository
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        2L,
                        start,
                        end))
                .thenReturn(List.of());

        healthPredictionService.getMonthlyPredictions(2L, 2026, 2);

        verify(healthPredictionRepository)
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        2L,
                        start,
                        end);
    }

    @Test
    void duplicatePredictionForSameQuestionnaireIsStillRejected() {
        Questionnaire questionnaire = mock(Questionnaire.class);

        when(questionnaireRepository.findById(25L))
                .thenReturn(Optional.of(questionnaire));
        when(healthPredictionRepository
                .existsByQuestionnaireQuestionnaireId(25L))
                .thenReturn(true);

        assertThatThrownBy(() -> healthPredictionService.createPrediction(25L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 예측 결과가 존재하는 문진");

        verifyNoInteractions(fastApiHealthPredictionClient);
        verifyNoInteractions(healthAlertRepository);
        verify(healthPredictionRepository, never()).save(any());
    }

    @Test
    void monthlyPredictionsRejectMissingPet() {
        when(petRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() ->
                healthPredictionService.getMonthlyPredictions(99L, 2026, 8))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));

        verifyNoInteractions(healthPredictionRepository);
    }

    @Test
    void monthlyPredictionsRejectInvalidMonth() {
        when(petRepository.existsById(1L)).thenReturn(true);

        assertThatThrownBy(() ->
                healthPredictionService.getMonthlyPredictions(1L, 2026, 0))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_REQUEST));

        verifyNoInteractions(healthPredictionRepository);
    }
}
