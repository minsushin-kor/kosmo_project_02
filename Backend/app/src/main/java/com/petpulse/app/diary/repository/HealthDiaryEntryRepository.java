package com.petpulse.app.diary.repository;

import com.petpulse.app.diary.entity.HealthDiaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HealthDiaryEntryRepository
        extends JpaRepository<HealthDiaryEntry, Long> {

    List<HealthDiaryEntry> findByPetPetIdAndRecordDateBetweenOrderByRecordDateAsc(
            Long petId,
            LocalDate startDate,
            LocalDate endDate);

    Optional<HealthDiaryEntry> findByPetPetIdAndRecordDate(
            Long petId,
            LocalDate recordDate);
}
