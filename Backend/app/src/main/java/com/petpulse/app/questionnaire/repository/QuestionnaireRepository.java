package com.petpulse.app.questionnaire.repository;

import com.petpulse.app.questionnaire.entity.Questionnaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {

    List<Questionnaire> findByPetPetIdOrderBySubmittedAtDesc(Long petId);

    List<Questionnaire> findByPetPetIdAndSubmittedAtGreaterThanEqualAndSubmittedAtLessThanOrderBySubmittedAtDesc(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);

    Page<Questionnaire> findByPetPetId(Long petId, Pageable pageable);

    @Query("""
            select q from Questionnaire q
            where q.pet.petId = :petId
              and exists (
                select p.predictionId from HealthPrediction p
                where p.questionnaire.questionnaireId = q.questionnaireId
              )
            """)
    Page<Questionnaire> findAnalyzedByPetId(
            @Param("petId") Long petId,
            Pageable pageable);

    @Query("""
            select q from Questionnaire q
            where q.pet.petId = :petId
              and not exists (
                select p.predictionId from HealthPrediction p
                where p.questionnaire.questionnaireId = q.questionnaireId
              )
            """)
    Page<Questionnaire> findPendingByPetId(
            @Param("petId") Long petId,
            Pageable pageable);

    @Query("""
            select count(q) from Questionnaire q
            where q.pet.petId = :petId
              and not exists (
                select p.predictionId from HealthPrediction p
                where p.questionnaire.questionnaireId = q.questionnaireId
              )
            """)
    long countPendingByPetId(@Param("petId") Long petId);

    Optional<Questionnaire> findByQuestionnaireIdAndPetUserLoginId(
            Long questionnaireId,
            String loginId);

    List<Questionnaire> findByPetPetIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);
}
