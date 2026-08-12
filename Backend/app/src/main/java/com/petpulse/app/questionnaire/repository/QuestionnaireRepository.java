package com.petpulse.app.questionnaire.repository;

import com.petpulse.app.questionnaire.entity.Questionnaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {

    List<Questionnaire> findByPetPetIdOrderBySubmittedAtDesc(Long petId);

    List<Questionnaire> findByPetPetIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);
}
