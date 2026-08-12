package com.petpulse.app.report.dto.ai;

import java.util.List;

public record AiWeeklyReportResponse(
        String reportTitle,
        String oneLineSummary,
        String reportContent,
        List<String> recommendedCare) {
}