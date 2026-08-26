package com.petpulse.app.lostpet.dto;

public record LostPetQrProfileResponse(
        String publicToken,
        boolean active,
        String guardianName,
        String guardianPhone,
        String petName,
        String species,
        String medicalHistory) {
}

