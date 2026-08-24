package com.petpulse.app.auth.controller;

import com.petpulse.app.auth.dto.LoginRequest;
import com.petpulse.app.auth.dto.LoginResponse;
import com.petpulse.app.auth.dto.SignupRequest;
import com.petpulse.app.auth.dto.UserResponse;
import com.petpulse.app.auth.service.AuthService;
import com.petpulse.app.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.signup(request), "회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.getCurrentUser(authentication.getName())));
    }
}
