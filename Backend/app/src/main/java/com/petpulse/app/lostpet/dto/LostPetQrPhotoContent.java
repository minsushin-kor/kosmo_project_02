package com.petpulse.app.lostpet.dto;

public record LostPetQrPhotoContent(
        byte[] data,
        String contentType,
        String originalFileName) {
}
