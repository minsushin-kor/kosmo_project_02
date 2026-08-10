package com.petpulse.app.pet.dto;

import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PetResponse(
        Long petId,
        Long userId,
        String petName,
        PetSpecies species,
        String breed,
        LocalDate birthDate,
        PetGender gender,
        BigDecimal weight,
        Boolean neutered,
        String medicalHistory,
        String profileImageUrl,
        LocalDateTime createdAt) {
}