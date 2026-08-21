package com.petpulse.app.vital.repository;

import com.petpulse.app.vital.entity.VitalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VitalRecordRepository
        extends JpaRepository<VitalRecord, Long> {

    List<VitalRecord> findByPetPetIdOrderByMeasuredAtDesc(Long petId);

    Optional<VitalRecord> findFirstByPetPetIdOrderByMeasuredAtDesc(Long petId);

    List<VitalRecord> findByPetPetIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            Long petId,
            LocalDateTime start,
            LocalDateTime end);
}