package com.petpulse.app.diary.entity;

import com.petpulse.app.pet.entity.Pet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "health_diary_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_health_diary_entries_pet_date",
                columnNames = {"pet_id", "record_date"}),
        indexes = @Index(
                name = "idx_health_diary_entries_pet_date",
                columnList = "pet_id, record_date"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthDiaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diary_entry_id")
    private Long diaryEntryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "pet_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_health_diary_entries_pet"))
    private Pet pet;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "guardian_status", nullable = false, length = 20)
    private GuardianStatus guardianStatus;

    @Column(name = "note", nullable = false, length = 300)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public HealthDiaryEntry(
            Pet pet,
            LocalDate recordDate,
            GuardianStatus guardianStatus,
            String note) {
        this.pet = pet;
        this.recordDate = recordDate;
        this.guardianStatus = guardianStatus;
        this.note = note;
    }

    public void update(GuardianStatus guardianStatus, String note) {
        this.guardianStatus = guardianStatus;
        this.note = note;
    }
}
