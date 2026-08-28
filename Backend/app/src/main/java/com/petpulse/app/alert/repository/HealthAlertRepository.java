package com.petpulse.app.alert.repository;

import com.petpulse.app.alert.entity.HealthAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HealthAlertRepository
        extends JpaRepository<HealthAlert, Long> {

    List<HealthAlert> findByPetPetIdOrderByCreatedAtDesc(Long petId);

    Optional<HealthAlert> findByAlertIdAndPetUserLoginId(
            Long alertId,
            String loginId);

    List<HealthAlert> findByPetPetIdAndCreatedAtBetween(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);

    @Modifying
    @Query("delete from HealthAlert alert where alert.prediction.predictionId = :predictionId")
    void deleteByPredictionId(@Param("predictionId") Long predictionId);
}
