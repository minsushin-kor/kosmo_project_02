package com.petpulse.app.prediction.repository;

import com.petpulse.app.prediction.entity.HealthPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import java.util.List;

public interface HealthPredictionRepository
                extends JpaRepository<HealthPrediction, Long> {

        Optional<HealthPrediction> findByQuestionnaireQuestionnaireId(
                        Long questionnaireId);

        boolean existsByQuestionnaireQuestionnaireId(
                        Long questionnaireId);

        List<HealthPrediction> findByQuestionnairePetPetIdAndPredictedAtBetweenOrderByPredictedAtAsc(
                        Long petId,
                        LocalDateTime start,
                        LocalDateTime end);
}