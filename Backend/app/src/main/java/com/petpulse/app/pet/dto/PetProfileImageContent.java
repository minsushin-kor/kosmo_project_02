package com.petpulse.app.pet.dto;

public record PetProfileImageContent(
        byte[] data,
        String contentType,
        String originalFileName,
        long updatedAtEpochMilli) {
}
