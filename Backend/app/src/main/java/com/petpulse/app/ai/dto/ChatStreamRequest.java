package com.petpulse.app.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatStreamRequest(
        @NotBlank(message = "질문을 입력해 주세요.") String message,
        String species) {
}
