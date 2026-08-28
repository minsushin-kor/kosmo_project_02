package com.petpulse.app.questionnaire.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.questionnaire.dto.QuestionnaireRequest;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;
    private final PetAccessService petAccessService;

    @Transactional
    public QuestionnaireResponse createQuestionnaire(
            String loginId,
            Long petId,
            QuestionnaireRequest request) {

        Pet pet = petAccessService.requireOwnedPet(loginId, petId);

        Questionnaire questionnaire = new Questionnaire(
                pet,
                request.temperature(),
                request.heartRate(),
                request.respiratoryRate(),
                request.skinCondition(),
                request.itching(),
                request.hairLoss(),
                request.vomiting(),
                request.diarrhea(),
                request.appetiteLevel(),
                request.waterIntakeLevel(),
                request.activityLevel(),
                request.symptomDurationDays(),
                request.additionalSymptoms());

        Questionnaire savedQuestionnaire = questionnaireRepository.save(questionnaire);

        return QuestionnaireResponse.from(savedQuestionnaire);
    }

    public List<QuestionnaireResponse> getQuestionnaires(String loginId, Long petId) {

        petAccessService.requireOwnedPet(loginId, petId);

        return questionnaireRepository
                .findByPetPetIdOrderBySubmittedAtDesc(petId)
                .stream()
                .map(QuestionnaireResponse::from)
                .toList();
    }

    public List<QuestionnaireResponse> getMonthlyQuestionnaires(
            String loginId,
            Long petId,
            int year,
            int month) {

        petAccessService.requireOwnedPet(loginId, petId);

        YearMonth yearMonth;
        if (year < 1 || year > 9999 || month < 1 || month > 12) {
            throw invalidYearMonth(year, month);
        }

        try {
            yearMonth = YearMonth.of(year, month);
        } catch (DateTimeException exception) {
            throw invalidYearMonth(year, month);
        }

        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        return questionnaireRepository
                .findByPetPetIdAndSubmittedAtGreaterThanEqualAndSubmittedAtLessThanOrderBySubmittedAtDesc(
                        petId,
                        start,
                        end)
                .stream()
                .map(QuestionnaireResponse::from)
                .toList();
    }

    public QuestionnaireResponse getQuestionnaire(String loginId, Long questionnaireId) {

        Questionnaire questionnaire = questionnaireRepository
                .findByQuestionnaireIdAndPetUserLoginId(questionnaireId, loginId)
                .orElseThrow(() -> petAccessService.notFound("문진을 찾을 수 없습니다."));

        return QuestionnaireResponse.from(questionnaire);
    }

    private BusinessException invalidYearMonth(int year, int month) {
        return new BusinessException(
                ErrorCode.INVALID_REQUEST,
                "유효하지 않은 연월입니다. year=" + year + ", month=" + month);
    }
}
