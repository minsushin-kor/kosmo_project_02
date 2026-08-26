package com.petpulse.app.lostpet.entity;

import com.petpulse.app.pet.entity.Pet;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "pet_lost_qr_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetLostQrProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_pet_lost_qr_profiles_pet"))
    private Pet pet;

    @Column(name = "public_token", nullable = false, unique = true, length = 64)
    private String publicToken;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "show_guardian_name", nullable = false)
    private boolean showGuardianName;

    @Column(name = "show_pet_details", nullable = false)
    private boolean showPetDetails;

    @Column(name = "show_medical_history", nullable = false)
    private boolean showMedicalHistory;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PetLostQrProfile(Pet pet, String publicToken) {
        this(pet, publicToken, true, true, true);
    }

    public PetLostQrProfile(
            Pet pet,
            String publicToken,
            boolean showGuardianName,
            boolean showPetDetails,
            boolean showMedicalHistory) {
        this.pet = pet;
        this.publicToken = publicToken;
        this.active = true;
        this.showGuardianName = showGuardianName;
        this.showPetDetails = showPetDetails;
        this.showMedicalHistory = showMedicalHistory;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }

    public void updateVisibility(
            boolean showGuardianName,
            boolean showPetDetails,
            boolean showMedicalHistory) {
        this.showGuardianName = showGuardianName;
        this.showPetDetails = showPetDetails;
        this.showMedicalHistory = showMedicalHistory;
    }
}
