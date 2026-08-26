package com.petpulse.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank @Size(max = 50) String userName,
        @NotBlank @Email @Size(max = 100) String email,
        @Size(max = 20) String phone,
        @Size(max = 100) String currentPassword,
        @Size(min = 8, max = 100) String newPassword,
        @Size(max = 20) String postalCode,
        @Size(max = 255) String address,
        @Size(max = 255) String detailAddress) {

    public UpdateUserRequest(String userName, String email, String phone,
            String currentPassword, String newPassword) {
        this(userName, email, phone, currentPassword, newPassword, null, null, null);
    }
}
