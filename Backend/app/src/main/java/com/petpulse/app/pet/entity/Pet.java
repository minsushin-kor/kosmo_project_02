package com.petpulse.app.pet.entity;

import com.petpulse.app.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pet_id")
    private Long petId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_pets_user"))
    private User user;

    @Column(name = "pet_name", nullable = false, length = 50)
    private String petName;

    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false, length = 20)
    private PetSpecies species;

    @Column(name = "breed", length = 100)
    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private PetGender gender;

    @Column(name = "weight", precision = 6, scale = 2)
    private BigDecimal weight;

    @Column(name = "neutered")
    private Boolean neutered;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Pet(
            User user,
            String petName,
            PetSpecies species,
            String breed,
            LocalDate birthDate,
            PetGender gender,
            BigDecimal weight,
            Boolean neutered,
            String medicalHistory,
            String profileImageUrl) {
        this.user = user;
        this.petName = petName;
        this.species = species;
        this.breed = breed;
        this.birthDate = birthDate;
        this.gender = gender;
        this.weight = weight;
        this.neutered = neutered;
        this.medicalHistory = medicalHistory;
        this.profileImageUrl = profileImageUrl;
    }

    public void update(
            String petName,
            PetSpecies species,
            String breed,
            LocalDate birthDate,
            PetGender gender,
            BigDecimal weight,
            Boolean neutered,
            String medicalHistory,
            String profileImageUrl) {
        this.petName = petName;
        this.species = species;
        this.breed = breed;
        this.birthDate = birthDate;
        this.gender = gender;
        this.weight = weight;
        this.neutered = neutered;
        this.medicalHistory = medicalHistory;
        this.profileImageUrl = profileImageUrl;
    }
}