package com.petpulse.app.lostpet.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateLostPetQrActiveRequest(
        @NotNull(message = "활성화 여부를 입력해 주세요.") Boolean active) {
}

