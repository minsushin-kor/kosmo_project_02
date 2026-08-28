package com.petpulse.app.healthrecord.dto;

import java.util.List;

public record HealthRecordPageResponse(
        List<HealthRecordSummaryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        long unanalyzedCount) {
}
