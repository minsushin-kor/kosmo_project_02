package com.petpulse.app.report.dto;

import com.petpulse.app.report.entity.WeeklyReport;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record WeeklyReportResponse(
        Long reportId,
        Long petId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal averageTemperature,
        BigDecimal averageHeartRate,
        int warningCount,
        int dangerCount,
        int questionnaireCount,
        BigDecimal averageRiskProbability,
        String oneLineSummary,
        String reportContent,
        LocalDateTime createdAt) {

    public static WeeklyReportResponse from(
            WeeklyReport report) {

        return new WeeklyReportResponse(
                report.getReportId(),
                report.getPet().getPetId(),
                report.getStartDate(),
                report.getEndDate(),
                report.getAverageTemperature(),
                report.getAverageHeartRate(),
                report.getWarningCount(),
                report.getDangerCount(),
                report.getQuestionnaireCount(),
                report.getAverageRiskProbability(),
                report.getOneLineSummary(),
                report.getReportContent(),
                report.getCreatedAt());
    }
}