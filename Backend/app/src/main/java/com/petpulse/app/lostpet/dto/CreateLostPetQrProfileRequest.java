package com.petpulse.app.lostpet.dto;

import jakarta.validation.constraints.NotNull;

public record CreateLostPetQrProfileRequest(
        @NotNull Boolean showGuardianName,
        @NotNull Boolean showPetDetails,
        @NotNull Boolean showMedicalHistory) {
}
