package com.petpulse.app.lostpet.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateLostPetQrVisibilityRequest(
        @NotNull Boolean showGuardianName,
        @NotNull Boolean showPetDetails,
        @NotNull Boolean showMedicalHistory) {
}
