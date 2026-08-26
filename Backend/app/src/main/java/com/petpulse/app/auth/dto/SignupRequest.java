package com.petpulse.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Size(max = 50) String loginId,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(max = 50) String userName,
        @Size(max = 20) String phone,
        @Size(max = 20) String postalCode,
        @Size(max = 255) String address,
        @Size(max = 255) String detailAddress) {

    public SignupRequest(String loginId, String password, String email,
            String userName, String phone) {
        this(loginId, password, email, userName, phone, null, null, null);
    }
}
