package com.petpulse.app.auth.service;

import com.petpulse.app.auth.dto.LoginRequest;
import com.petpulse.app.auth.dto.SignupRequest;
import com.petpulse.app.auth.security.JwtTokenProvider;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import com.petpulse.app.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtTokenProvider = mock(JwtTokenProvider.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider);
    }

    @Test
    void signupStoresOnlyBcryptPassword() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.signup(new SignupRequest(
                " guardian ", "password123", "USER@EXAMPLE.COM", " 보호자 ", "010-1234-5678"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertNotEquals("password123", saved.getPassword());
        assertTrue(saved.getPassword().startsWith("$2"));
        assertTrue(passwordEncoder.matches("password123", saved.getPassword()));
        assertEquals("guardian", saved.getLoginId());
        assertEquals("user@example.com", saved.getEmail());
        assertEquals(UserRole.USER, saved.getRole());
    }

    @Test
    void duplicatedLoginIdReturnsConflictBusinessError() {
        when(userRepository.existsByLoginId("guardian")).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.signup(new SignupRequest(
                        "guardian", "password123", "user@example.com", "보호자", null)));

        assertEquals(ErrorCode.DUPLICATE_RESOURCE, exception.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsBearerTokenForMatchingBcryptPassword() {
        User user = new User("guardian", passwordEncoder.encode("password123"),
                "user@example.com", "보호자", null, UserRole.USER);
        when(userRepository.findByLoginId("guardian")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.createToken(user)).thenReturn("signed.jwt.token");
        when(jwtTokenProvider.getExpirationSeconds()).thenReturn(3600L);

        var response = authService.login(new LoginRequest("guardian", "password123"));

        assertEquals("signed.jwt.token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(3600L, response.expiresIn());
    }

    @Test
    void loginDoesNotAcceptPlaintextOrWrongPassword() {
        User user = new User("guardian", passwordEncoder.encode("password123"),
                "user@example.com", "보호자", null, UserRole.USER);
        when(userRepository.findByLoginId("guardian")).thenReturn(Optional.of(user));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest("guardian", "wrong-password")));

        assertEquals(ErrorCode.AUTHENTICATION_FAILED, exception.getErrorCode());
        verify(jwtTokenProvider, never()).createToken(any());
    }
}
