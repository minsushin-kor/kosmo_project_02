package com.petpulse.app.questionnaire.service;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.questionnaire.dto.QuestionnaireRequest;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;
import com.petpulse.app.questionnaire.entity.Questionnaire;
import com.petpulse.app.questionnaire.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public QuestionnaireResponse getQuestionnaire(String loginId, Long questionnaireId) {

        Questionnaire questionnaire = questionnaireRepository
                .findByQuestionnaireIdAndPetUserLoginId(questionnaireId, loginId)
                .orElseThrow(() -> petAccessService.notFound("문진을 찾을 수 없습니다."));

        return QuestionnaireResponse.from(questionnaire);
    }
}
