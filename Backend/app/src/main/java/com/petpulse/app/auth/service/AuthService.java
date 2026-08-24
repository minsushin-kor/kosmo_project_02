package com.petpulse.app.auth.service;

import com.petpulse.app.auth.dto.LoginRequest;
import com.petpulse.app.auth.dto.LoginResponse;
import com.petpulse.app.auth.dto.SignupRequest;
import com.petpulse.app.auth.dto.UserResponse;
import com.petpulse.app.auth.security.JwtTokenProvider;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import com.petpulse.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String loginId = request.loginId().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByLoginId(loginId)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 사용 중인 이메일입니다.");
        }

        User user = new User(loginId, passwordEncoder.encode(request.password()), email,
                request.userName().trim(), normalizeNullable(request.phone()), UserRole.USER);
        return UserResponse.from(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.loginId().trim())
                .orElseThrow(this::authenticationFailed);
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw authenticationFailed();
        }
        return new LoginResponse(jwtTokenProvider.createToken(user), "Bearer",
                jwtTokenProvider.getExpirationSeconds(), UserResponse.from(user));
    }

    public UserResponse getCurrentUser(String loginId) {
        return userRepository.findByLoginId(loginId)
                .map(UserResponse::from)
                .orElseThrow(this::authenticationFailed);
    }

    private BusinessException authenticationFailed() {
        return new BusinessException(ErrorCode.AUTHENTICATION_FAILED,
                "아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
