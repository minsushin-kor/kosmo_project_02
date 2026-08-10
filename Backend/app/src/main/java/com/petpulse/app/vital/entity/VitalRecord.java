package com.petpulse.app.vital.entity;

import com.petpulse.app.pet.entity.Pet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VitalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vital_record_id")
    private Long vitalRecordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_vital_records_pet"))
    private Pet pet;

    @Column(name = "temperature", precision = 4, scale = 1, nullable = false)
    private BigDecimal temperature;

    @Column(name = "heart_rate", nullable = false)
    private Integer heartRate;

    @Column(name = "respiratory_rate", nullable = false)
    private Integer respiratoryRate;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    private VitalSourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VitalStatus status;
}