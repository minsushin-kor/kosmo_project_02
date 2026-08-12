package com.petpulse.app.alert.entity;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.prediction.entity.HealthPrediction;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_alerts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_health_alerts_pet"))
    private Pet pet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", foreignKey = @ForeignKey(name = "fk_health_alerts_prediction"))
    private HealthPrediction prediction;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 20)
    private HealthAlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private AlertSeverity severity;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public HealthAlert(
            Pet pet,
            HealthPrediction prediction,
            HealthAlertType alertType,
            AlertSeverity severity,
            String title,
            String message) {

        this.pet = pet;
        this.prediction = prediction;
        this.alertType = alertType;
        this.severity = severity;
        this.title = title;
        this.message = message;
    }

    public void markAsRead() {
        this.read = true;
    }
}