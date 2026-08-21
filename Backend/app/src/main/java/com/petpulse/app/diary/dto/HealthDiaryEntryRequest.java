package com.petpulse.app.diary.dto;

import com.petpulse.app.diary.entity.GuardianStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HealthDiaryEntryRequest(
        @NotNull GuardianStatus status,
        @Size(max = 300) String note) {
}
