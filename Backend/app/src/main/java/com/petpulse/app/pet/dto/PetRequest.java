package com.petpulse.app.pet.dto;

import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PetRequest(

        @NotNull Long userId,

        @NotBlank @Size(max = 50) String petName,

        @NotNull PetSpecies species,

        @Size(max = 100) String breed,

        LocalDate birthDate,

        PetGender gender,

        @DecimalMin(value = "0.1") @DecimalMax(value = "9999.99") BigDecimal weight,

        Boolean neutered,

        String medicalHistory,

        @Size(max = 500) String profileImageUrl) {
}