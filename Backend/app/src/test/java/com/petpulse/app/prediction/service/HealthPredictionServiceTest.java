package com.petpulse.app.prediction.service;

import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.prediction.entity.HealthPrediction;
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
    private PetAccessService petAccessService;
    @Mock
    private Pet pet;

    private HealthPredictionService healthPredictionService;

    @BeforeEach
    void setUp() {
        healthPredictionService = new HealthPredictionService(
                healthPredictionRepository,
                questionnaireRepository,
                fastApiHealthPredictionClient,
                healthAlertRepository,
                petAccessService);
    }

    @Test
    void monthlyPredictionsUseWholeMonthAndReturnEmptyList() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 8, 31, 23, 59, 59, 999_999_999);

        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(healthPredictionRepository
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        1L,
                        start,
                        end))
                .thenReturn(List.of());

        assertThat(healthPredictionService.getMonthlyPredictions("guardian", 1L, 2026, 8))
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

        when(petAccessService.requireOwnedPet("guardian", 2L)).thenReturn(pet);
        when(healthPredictionRepository
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        2L,
                        start,
                        end))
                .thenReturn(List.of());

        healthPredictionService.getMonthlyPredictions("guardian", 2L, 2026, 2);

        verify(healthPredictionRepository)
                .findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        2L,
                        start,
                        end);
    }

    @Test
    void duplicatePredictionForSameQuestionnaireIsStillRejected() {
        Questionnaire questionnaire = mock(Questionnaire.class);

        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(25L, "guardian"))
                .thenReturn(Optional.of(questionnaire));
        when(healthPredictionRepository
                .existsByQuestionnaireQuestionnaireId(25L))
                .thenReturn(true);

        assertThatThrownBy(() -> healthPredictionService.createPrediction("guardian", 25L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 예측 결과가 존재하는 문진");

        verifyNoInteractions(fastApiHealthPredictionClient);
        verifyNoInteractions(healthAlertRepository);
        verify(healthPredictionRepository, never()).save(any());
    }

    @Test
    void foreignQuestionnaireCannotCreatePrediction() {
        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(25L, "other"))
                .thenReturn(Optional.empty());
        when(petAccessService.notFound(anyString()))
                .thenReturn(new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "문진을 찾을 수 없습니다."));

        assertThatThrownBy(() -> healthPredictionService.createPrediction("other", 25L))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));

        verifyNoInteractions(fastApiHealthPredictionClient, healthAlertRepository);
        verify(healthPredictionRepository, never()).save(any());
    }

    @Test
    void predictionResourceLookupUsesAuthenticatedOwner() {
        HealthPrediction prediction = mock(HealthPrediction.class);
        Questionnaire questionnaire = mock(Questionnaire.class);
        when(prediction.getQuestionnaire()).thenReturn(questionnaire);
        when(questionnaire.getQuestionnaireId()).thenReturn(25L);
        when(healthPredictionRepository
                .findByPredictionIdAndQuestionnairePetUserLoginId(7L, "guardian"))
                .thenReturn(Optional.of(prediction));

        assertThat(healthPredictionService.getPrediction("guardian", 7L).questionnaireId())
                .isEqualTo(25L);

        when(healthPredictionRepository
                .findByPredictionIdAndQuestionnairePetUserLoginId(7L, "other"))
                .thenReturn(Optional.empty());
        when(petAccessService.notFound(anyString()))
                .thenReturn(new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "예측 결과를 찾을 수 없습니다."));
        assertThatThrownBy(() -> healthPredictionService.getPrediction("other", 7L))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));
    }

    @Test
    void monthlyPredictionsRejectMissingPet() {
        when(petAccessService.requireOwnedPet("guardian", 99L))
                .thenThrow(new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "반려동물을 찾을 수 없습니다."));

        assertThatThrownBy(() ->
                healthPredictionService.getMonthlyPredictions("guardian", 99L, 2026, 8))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));

        verifyNoInteractions(healthPredictionRepository);
    }

    @Test
    void monthlyPredictionsRejectInvalidMonth() {
        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);

        assertThatThrownBy(() ->
                healthPredictionService.getMonthlyPredictions("guardian", 1L, 2026, 0))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_REQUEST));

        verifyNoInteractions(healthPredictionRepository);
    }

    @Test
    void allPredictionsUseOwnerAndRepositoryDescendingOrder() {
        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(healthPredictionRepository.findByQuestionnairePetPetIdOrderByPredictedAtDesc(1L))
                .thenReturn(List.of());

        assertThat(healthPredictionService.getPredictions("guardian", 1L)).isEmpty();

        verify(healthPredictionRepository).findByQuestionnairePetPetIdOrderByPredictedAtDesc(1L);
    }

    @Test
    void allPredictionsRejectForeignPetBeforeQuery() {
        when(petAccessService.requireOwnedPet("other", 1L))
                .thenThrow(new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "반려동물을 찾을 수 없습니다."));

        assertThatThrownBy(() -> healthPredictionService.getPredictions("other", 1L))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));

        verifyNoInteractions(healthPredictionRepository);
    }
}
