package com.petpulse.app.auth.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class ProductionJwtSecretValidator {
    static final String DEVELOPMENT_SECRET = "petpulse-development-secret-key-change-me";

    private final Environment environment;
    private final String jwtSecret;

    public ProductionJwtSecretValidator(
            Environment environment,
            @Value("${security.jwt.secret}") String jwtSecret) {
        this.environment = environment;
        this.jwtSecret = jwtSecret;
    }

    @PostConstruct
    void validate() {
        boolean production = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (production && DEVELOPMENT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "운영 프로필에서는 JWT_SECRET 환경변수를 반드시 설정해야 합니다.");
        }
    }
}
