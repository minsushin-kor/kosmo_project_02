package com.petpulse.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Size(max = 50) String loginId,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(max = 50) String userName,
        @Size(max = 20) String phone) {
}
