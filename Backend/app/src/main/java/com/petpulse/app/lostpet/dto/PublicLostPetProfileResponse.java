package com.petpulse.app.lostpet.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PublicLostPetProfileResponse(
        String guardianName,
        String guardianPhone,
        String petName,
        String species,
        String breed,
        String medicalHistory) {
}
