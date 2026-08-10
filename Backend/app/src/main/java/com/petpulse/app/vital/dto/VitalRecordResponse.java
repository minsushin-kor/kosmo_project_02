package com.petpulse.app.vital.dto;

import com.petpulse.app.vital.entity.VitalSourceType;
import com.petpulse.app.vital.entity.VitalStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VitalRecordResponse(
        Long vitalRecordId,
        Long petId,
        BigDecimal temperature,
        Integer heartRate,
        Integer respiratoryRate,
        LocalDateTime measuredAt,
        VitalSourceType sourceType,
        VitalStatus status) {
}