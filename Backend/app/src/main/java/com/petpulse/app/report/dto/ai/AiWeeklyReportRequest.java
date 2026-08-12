package com.petpulse.app.report.dto.ai;

public record AiWeeklyReportRequest(
        String petName,
        String species,
        int age,
        double avgTemperature,
        double avgHeartRate,
        double avgRespiratoryRate,
        int cautionAlertCount,
        int dangerAlertCount,
        int questionnaireCount,
        String mainSymptomsSummary) {
}