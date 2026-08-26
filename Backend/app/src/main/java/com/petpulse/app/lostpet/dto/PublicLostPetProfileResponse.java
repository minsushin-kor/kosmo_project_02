package com.petpulse.app.lostpet.dto;

public record PublicLostPetProfileResponse(
        String guardianName,
        String guardianPhone,
        String petName,
        String species,
        String medicalHistory) {
}

