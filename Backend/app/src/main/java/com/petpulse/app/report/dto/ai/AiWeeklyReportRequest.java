package com.petpulse.app.report.dto.ai;

public record AiWeeklyReportRequest(
        String petName,
        String species,
        int age,
        Double avgTemperature,
        Double avgHeartRate,
        Double avgRespiratoryRate,
        int cautionAlertCount,
        int dangerAlertCount,
        int questionnaireCount,
        Double averageRiskProbability,
        String mainSymptomsSummary) {
}
