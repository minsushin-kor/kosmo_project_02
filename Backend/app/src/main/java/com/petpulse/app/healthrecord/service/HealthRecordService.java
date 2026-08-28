package com.petpulse.app.healthrecord.service;

import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.healthrecord.dto.HealthRecordDetailResponse;
import com.petpulse.app.healthrecord.dto.HealthRecordPageResponse;
import com.petpulse.app.healthrecord.dto.HealthRecordStatus;
import com.petpulse.app.healthrecord.dto.HealthRecordSummaryResponse;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.prediction.dto.HealthPredictionResponse;
import com.petpulse.app.prediction.entity.HealthPrediction;
import com.petpulse.app.prediction.repository.HealthPredictionRepository;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import com.petpulse.app.report.repository.WeeklyReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthRecordService {

    private static final int MAX_PAGE_SIZE = 24;

    private final PetAccessService petAccessService;
    private final QuestionnaireRepository questionnaireRepository;
    private final HealthPredictionRepository healthPredictionRepository;
    private final HealthAlertRepository healthAlertRepository;
    private final WeeklyReportRepository weeklyReportRepository;

    public HealthRecordPageResponse getHealthRecords(
            String loginId,
            Long petId,
            int page,
            int size,
            HealthRecordStatus status) {

        petAccessService.requireOwnedPet(loginId, petId);
        validatePageRequest(page, size);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "submittedAt"));

        Page<Questionnaire> questionnairePage = switch (status) {
            case ALL -> questionnaireRepository.findByPetPetId(petId, pageable);
            case ANALYZED -> questionnaireRepository.findAnalyzedByPetId(petId, pageable);
            case PENDING -> questionnaireRepository.findPendingByPetId(petId, pageable);
        };

        List<Long> questionnaireIds = questionnairePage.getContent()
                .stream()
                .map(Questionnaire::getQuestionnaireId)
                .toList();

        Map<Long, HealthPrediction> predictionByQuestionnaireId = questionnaireIds.isEmpty()
                ? Map.of()
                : healthPredictionRepository
                        .findByQuestionnaireQuestionnaireIdIn(questionnaireIds)
                        .stream()
                        .collect(Collectors.toMap(
                                prediction -> prediction.getQuestionnaire().getQuestionnaireId(),
                                Function.identity()));

        List<HealthRecordSummaryResponse> content = questionnairePage.getContent()
                .stream()
                .map(questionnaire -> HealthRecordSummaryResponse.from(
                        questionnaire,
                        predictionByQuestionnaireId.get(questionnaire.getQuestionnaireId())))
                .toList();

        return new HealthRecordPageResponse(
                content,
                questionnairePage.getNumber(),
                questionnairePage.getSize(),
                questionnairePage.getTotalElements(),
                questionnairePage.getTotalPages(),
                questionnairePage.isFirst(),
                questionnairePage.isLast(),
                questionnaireRepository.countPendingByPetId(petId));
    }

    public HealthRecordDetailResponse getHealthRecord(
            String loginId,
            Long questionnaireId) {

        Questionnaire questionnaire = requireOwnedQuestionnaire(
                loginId,
                questionnaireId);

        HealthPredictionResponse prediction = healthPredictionRepository
                .findByQuestionnaireQuestionnaireId(questionnaireId)
                .map(HealthPredictionResponse::from)
                .orElse(null);

        return new HealthRecordDetailResponse(
                QuestionnaireResponse.from(questionnaire),
                prediction);
    }

    @Transactional
    public void deleteHealthRecord(
            String loginId,
            Long questionnaireId) {

        Questionnaire questionnaire = requireOwnedQuestionnaire(
                loginId,
                questionnaireId);

        healthPredictionRepository
                .findByQuestionnaireQuestionnaireId(questionnaireId)
                .ifPresent(prediction -> healthAlertRepository
                        .deleteByPredictionId(prediction.getPredictionId()));

        healthPredictionRepository
                .deleteByQuestionnaireQuestionnaireId(questionnaireId);

        LocalDate recordDate = questionnaire.getSubmittedAt().toLocalDate();
        weeklyReportRepository.deleteContainingRecordDate(
                questionnaire.getPet().getPetId(),
                recordDate);

        questionnaireRepository.delete(questionnaire);
    }

    private Questionnaire requireOwnedQuestionnaire(
            String loginId,
            Long questionnaireId) {

        return questionnaireRepository
                .findByQuestionnaireIdAndPetUserLoginId(
                        questionnaireId,
                        loginId)
                .orElseThrow(() -> petAccessService.notFound(
                        "건강 기록을 찾을 수 없습니다."));
    }

    private void validatePageRequest(
            int page,
            int size) {

        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "페이지 번호는 0 이상, 페이지 크기는 1 이상 24 이하여야 합니다.");
        }
    }
}
