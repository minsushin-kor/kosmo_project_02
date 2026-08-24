package com.petpulse.app.auth.controller;

import com.petpulse.app.auth.dto.LoginResponse;
import com.petpulse.app.auth.dto.UserResponse;
import com.petpulse.app.auth.service.AuthService;
import com.petpulse.app.global.exception.GlobalExceptionHandler;
import com.petpulse.app.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {
    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void signupReturnsCreatedCommonResponseWithoutPassword() throws Exception {
        when(authService.signup(any())).thenReturn(userResponse());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "loginId":"guardian",
                                  "password":"password123",
                                  "email":"user@example.com",
                                  "userName":"보호자",
                                  "phone":"010-1234-5678"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginId").value("guardian"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void invalidSignupReturnsCommonValidationError() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"loginId":"","password":"short","email":"bad","userName":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void loginReturnsJwtInCommonResponse() throws Exception {
        when(authService.login(any())).thenReturn(
                new LoginResponse("signed.jwt.token", "Bearer", 3600, userResponse()));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"loginId":"guardian","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("signed.jwt.token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }

    @Test
    void meUsesAuthenticatedLoginId() throws Exception {
        when(authService.getCurrentUser("guardian")).thenReturn(userResponse());

        mockMvc.perform(get("/api/auth/me")
                        .principal(new UsernamePasswordAuthenticationToken("guardian", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("guardian"));
    }

    private UserResponse userResponse() {
        return new UserResponse(1L, "guardian", "user@example.com",
                "보호자", "010-1234-5678", UserRole.USER);
    }
}
