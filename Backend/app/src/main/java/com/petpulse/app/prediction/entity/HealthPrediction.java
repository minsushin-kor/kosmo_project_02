package com.petpulse.app.prediction.entity;

import com.petpulse.app.questionnaire.entity.Questionnaire;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "health_predictions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id")
    private Long predictionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionnaire_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_health_predictions_questionnaire"))
    private Questionnaire questionnaire;

    @Column(name = "abnormal_probability", precision = 5, scale = 4, nullable = false)
    private BigDecimal abnormalProbability;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_grade", nullable = false, length = 20)
    private RiskGrade riskGrade;

    @Column(name = "primary_risk_factor", length = 100)
    private String primaryRiskFactor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_factors_json", columnDefinition = "jsonb")
    private String riskFactorsJson;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "model_version", length = 50, nullable = false)
    private String modelVersion;

    @CreationTimestamp
    @Column(name = "predicted_at", nullable = false, updatable = false)
    private LocalDateTime predictedAt;

    public HealthPrediction(
            Questionnaire questionnaire,
            BigDecimal abnormalProbability,
            RiskGrade riskGrade,
            String primaryRiskFactor,
            String riskFactorsJson,
            String aiSummary,
            String modelVersion) {

        this.questionnaire = questionnaire;
        this.abnormalProbability = abnormalProbability;
        this.riskGrade = riskGrade;
        this.primaryRiskFactor = primaryRiskFactor;
        this.riskFactorsJson = riskFactorsJson;
        this.aiSummary = aiSummary;
        this.modelVersion = modelVersion;
    }
}