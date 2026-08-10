package com.petpulse.app.questionnaire.service;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
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
    private final PetRepository petRepository;

    @Transactional
    public QuestionnaireResponse createQuestionnaire(
            Long petId,
            QuestionnaireRequest request) {

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 반려동물입니다. petId=" + petId));

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

    public List<QuestionnaireResponse> getQuestionnaires(Long petId) {

        if (!petRepository.existsById(petId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 반려동물입니다. petId=" + petId);
        }

        return questionnaireRepository
                .findByPetPetIdOrderBySubmittedAtDesc(petId)
                .stream()
                .map(QuestionnaireResponse::from)
                .toList();
    }

    public QuestionnaireResponse getQuestionnaire(Long questionnaireId) {

        Questionnaire questionnaire = questionnaireRepository
                .findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 문진입니다. questionnaireId="
                                + questionnaireId));

        return QuestionnaireResponse.from(questionnaire);
    }
}