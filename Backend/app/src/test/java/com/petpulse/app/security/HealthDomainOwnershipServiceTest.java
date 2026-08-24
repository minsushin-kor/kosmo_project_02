package com.petpulse.app.security;

import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.entity.HealthAlertType;
import com.petpulse.app.alert.entity.AlertSeverity;
import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.alert.service.HealthAlertService;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.questionnaire.service.QuestionnaireService;
import com.petpulse.app.report.client.FastApiWeeklyReportClient;
import com.petpulse.app.report.entity.WeeklyReport;
import com.petpulse.app.report.repository.WeeklyReportRepository;
import com.petpulse.app.report.service.WeeklyReportService;
import com.petpulse.app.vital.repository.VitalRecordRepository;
import com.petpulse.app.vital.service.VitalRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthDomainOwnershipServiceTest {
    @Mock PetAccessService access;
    @Mock Pet pet;
    @Mock VitalRecordRepository vitalRepository;
    @Mock HealthAlertRepository alertRepository;
    @Mock QuestionnaireRepository questionnaireRepository;
    @Mock WeeklyReportRepository reportRepository;
    @Mock HealthPredictionRepository predictionRepository;
    @Mock FastApiWeeklyReportClient reportClient;
    private BusinessException notFound;

    @BeforeEach
    void setUp() {
        notFound = new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "찾을 수 없습니다.");
        lenient().when(access.notFound(anyString())).thenReturn(notFound);
    }

    @Test
    void vitalListAllowsOwnerAndRejectsForeignPet() {
        VitalRecordService service = new VitalRecordService(vitalRepository, access, alertRepository);
        when(access.requireOwnedPet("owner", 1L)).thenReturn(pet);
        when(vitalRepository.findByPetPetIdOrderByMeasuredAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getVitalRecords("owner", 1L)).isEmpty();
        when(access.requireOwnedPet("other", 1L)).thenThrow(notFound);
        assertNotFound(() -> service.getVitalRecords("other", 1L));
    }

    @Test
    void questionnairePetAndResourceEndpointsEnforceOwner() {
        QuestionnaireService service = new QuestionnaireService(questionnaireRepository, access);
        when(access.requireOwnedPet("owner", 1L)).thenReturn(pet);
        when(questionnaireRepository.findByPetPetIdOrderBySubmittedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getQuestionnaires("owner", 1L)).isEmpty();
        when(access.requireOwnedPet("other", 1L)).thenThrow(notFound);
        assertNotFound(() -> service.getQuestionnaires("other", 1L));

        Questionnaire questionnaire = mock(Questionnaire.class);
        when(questionnaire.getPet()).thenReturn(pet);
        when(pet.getPetId()).thenReturn(1L);
        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(7L, "owner"))
                .thenReturn(Optional.of(questionnaire));
        assertThat(service.getQuestionnaire("owner", 7L).petId()).isEqualTo(1L);
        when(questionnaireRepository.findByQuestionnaireIdAndPetUserLoginId(7L, "other"))
                .thenReturn(Optional.empty());
        assertNotFound(() -> service.getQuestionnaire("other", 7L));
    }

    @Test
    void alertPetAndResourceEndpointsEnforceOwner() {
        HealthAlertService service = new HealthAlertService(alertRepository, access);
        when(access.requireOwnedPet("owner", 1L)).thenReturn(pet);
        when(alertRepository.findByPetPetIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getAlertsByPet("owner", 1L)).isEmpty();
        when(access.requireOwnedPet("other", 1L)).thenThrow(notFound);
        assertNotFound(() -> service.getAlertsByPet("other", 1L));

        HealthAlert alert = mock(HealthAlert.class);
        when(alert.getPet()).thenReturn(pet);
        when(alert.getAlertType()).thenReturn(HealthAlertType.VITAL);
        when(alert.getSeverity()).thenReturn(AlertSeverity.WATCH);
        when(pet.getPetId()).thenReturn(1L);
        when(alertRepository.findByAlertIdAndPetUserLoginId(8L, "owner")).thenReturn(Optional.of(alert));
        assertThat(service.markAsRead("owner", 8L).petId()).isEqualTo(1L);
        verify(alert).markAsRead();
        when(alertRepository.findByAlertIdAndPetUserLoginId(8L, "other")).thenReturn(Optional.empty());
        assertNotFound(() -> service.markAsRead("other", 8L));
    }

    @Test
    void reportPetAndResourceEndpointsEnforceOwner() {
        WeeklyReportService service = new WeeklyReportService(reportRepository, access, vitalRepository,
                questionnaireRepository, predictionRepository, alertRepository, reportClient);
        when(access.requireOwnedPet("owner", 1L)).thenReturn(pet);
        when(reportRepository.findByPetPetIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getWeeklyReports("owner", 1L)).isEmpty();
        when(access.requireOwnedPet("other", 1L)).thenThrow(notFound);
        assertNotFound(() -> service.getWeeklyReports("other", 1L));

        WeeklyReport report = mock(WeeklyReport.class);
        when(report.getPet()).thenReturn(pet);
        when(pet.getPetId()).thenReturn(1L);
        when(reportRepository.findByReportIdAndPetUserLoginId(9L, "owner")).thenReturn(Optional.of(report));
        assertThat(service.getWeeklyReport("owner", 9L).petId()).isEqualTo(1L);
        when(reportRepository.findByReportIdAndPetUserLoginId(9L, "other")).thenReturn(Optional.empty());
        assertNotFound(() -> service.getWeeklyReport("other", 9L));
    }

    private void assertNotFound(Runnable action) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));
    }
}
