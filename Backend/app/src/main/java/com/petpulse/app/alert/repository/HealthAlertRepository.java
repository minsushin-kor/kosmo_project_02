package com.petpulse.app.alert.repository;

import com.petpulse.app.alert.entity.HealthAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface HealthAlertRepository
        extends JpaRepository<HealthAlert, Long> {

    List<HealthAlert> findByPetPetIdOrderByCreatedAtDesc(Long petId);

    List<HealthAlert> findByPetPetIdAndCreatedAtBetween(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);
}