package com.petpulse.app.questionnaire.entity;

import com.petpulse.app.pet.entity.Pet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "questionnaires")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Questionnaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "questionnaire_id")
    private Long questionnaireId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_questionnaires_pet"))
    private Pet pet;

    @Column(name = "temperature", precision = 4, scale = 1, nullable = false)
    private BigDecimal temperature;

    @Column(name = "heart_rate", nullable = false)
    private Integer heartRate;

    @Column(name = "respiratory_rate", nullable = false)
    private Integer respiratoryRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "skin_condition", nullable = false, length = 20)
    private SkinCondition skinCondition;

    @Column(name = "itching", nullable = false)
    private Boolean itching;

    @Column(name = "hair_loss", nullable = false)
    private Boolean hairLoss;

    @Column(name = "vomiting", nullable = false)
    private Boolean vomiting;

    @Column(name = "diarrhea", nullable = false)
    private Boolean diarrhea;

    @Enumerated(EnumType.STRING)
    @Column(name = "appetite_level", nullable = false, length = 20)
    private AppetiteLevel appetiteLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_intake_level", nullable = false, length = 20)
    private WaterIntakeLevel waterIntakeLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level", nullable = false, length = 20)
    private ActivityLevel activityLevel;

    @Column(name = "symptom_duration_days", nullable = false)
    private Integer symptomDurationDays;

    @Column(name = "additional_symptoms", columnDefinition = "TEXT")
    private String additionalSymptoms;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    public Questionnaire(
            Pet pet,
            BigDecimal temperature,
            Integer heartRate,
            Integer respiratoryRate,
            SkinCondition skinCondition,
            Boolean itching,
            Boolean hairLoss,
            Boolean vomiting,
            Boolean diarrhea,
            AppetiteLevel appetiteLevel,
            WaterIntakeLevel waterIntakeLevel,
            ActivityLevel activityLevel,
            Integer symptomDurationDays,
            String additionalSymptoms) {

        this.pet = pet;
        this.temperature = temperature;
        this.heartRate = heartRate;
        this.respiratoryRate = respiratoryRate;
        this.skinCondition = skinCondition;
        this.itching = itching;
        this.hairLoss = hairLoss;
        this.vomiting = vomiting;
        this.diarrhea = diarrhea;
        this.appetiteLevel = appetiteLevel;
        this.waterIntakeLevel = waterIntakeLevel;
        this.activityLevel = activityLevel;
        this.symptomDurationDays = symptomDurationDays;
        this.additionalSymptoms = additionalSymptoms;
    }
}