package com.petpulse.app.vital.dto;

import com.petpulse.app.vital.entity.VitalSourceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VitalRecordRequest(

        @NotNull @DecimalMin(value = "30.0") @DecimalMax(value = "45.0") BigDecimal temperature,

        @NotNull @Positive Integer heartRate,

        @NotNull @Positive Integer respiratoryRate,

        LocalDateTime measuredAt,

        @NotNull VitalSourceType sourceType) {
}