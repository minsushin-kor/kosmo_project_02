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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PetLostQrProfile(Pet pet, String publicToken) {
        this.pet = pet;
        this.publicToken = publicToken;
        this.active = true;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }

    public void rotateToken(String publicToken) {
        this.publicToken = publicToken;
    }
}

