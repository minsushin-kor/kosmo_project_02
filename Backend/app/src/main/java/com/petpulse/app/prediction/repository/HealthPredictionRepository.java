package com.petpulse.app.prediction.repository;

import com.petpulse.app.prediction.entity.HealthPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthPredictionRepository
        extends JpaRepository<HealthPrediction, Long> {

    Optional<HealthPrediction> findByQuestionnaireQuestionnaireId(
            Long questionnaireId);

    boolean existsByQuestionnaireQuestionnaireId(
            Long questionnaireId);
}