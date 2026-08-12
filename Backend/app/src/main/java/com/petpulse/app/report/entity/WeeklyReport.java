package com.petpulse.app.report.entity;

import com.petpulse.app.pet.entity.Pet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_weekly_reports_pet"))
    private Pet pet;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "average_temperature", precision = 4, scale = 1)
    private BigDecimal averageTemperature;

    @Column(name = "average_heart_rate", precision = 6, scale = 2)
    private BigDecimal averageHeartRate;

    @Column(name = "warning_count", nullable = false)
    private int warningCount;

    @Column(name = "danger_count", nullable = false)
    private int dangerCount;

    @Column(name = "questionnaire_count", nullable = false)
    private int questionnaireCount;

    @Column(name = "average_risk_probability", precision = 5, scale = 4)
    private BigDecimal averageRiskProbability;

    @Column(name = "one_line_summary", length = 255)
    private String oneLineSummary;

    @Column(name = "report_content", columnDefinition = "TEXT")
    private String reportContent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public WeeklyReport(
            Pet pet,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal averageTemperature,
            BigDecimal averageHeartRate,
            int warningCount,
            int dangerCount,
            int questionnaireCount,
            BigDecimal averageRiskProbability,
            String oneLineSummary,
            String reportContent) {

        this.pet = pet;
        this.startDate = startDate;
        this.endDate = endDate;
        this.averageTemperature = averageTemperature;
        this.averageHeartRate = averageHeartRate;
        this.warningCount = warningCount;
        this.dangerCount = dangerCount;
        this.questionnaireCount = questionnaireCount;
        this.averageRiskProbability = averageRiskProbability;
        this.oneLineSummary = oneLineSummary;
        this.reportContent = reportContent;
    }
}