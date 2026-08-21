package com.petpulse.app.diary.dto;

import com.petpulse.app.diary.entity.GuardianStatus;
import com.petpulse.app.diary.entity.HealthDiaryEntry;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record HealthDiaryEntryResponse(
        Long diaryEntryId,
        Long petId,
        LocalDate date,
        GuardianStatus status,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static HealthDiaryEntryResponse from(HealthDiaryEntry entry) {
        return new HealthDiaryEntryResponse(
                entry.getDiaryEntryId(),
                entry.getPet().getPetId(),
                entry.getRecordDate(),
                entry.getGuardianStatus(),
                entry.getNote(),
                entry.getCreatedAt(),
                entry.getUpdatedAt());
    }
}
