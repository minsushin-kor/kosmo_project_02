package com.petpulse.app.auth.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductionJwtSecretValidatorTest {
    @Test
    void productionRejectsDevelopmentDefaultSecret() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        var validator = new ProductionJwtSecretValidator(
                environment, ProductionJwtSecretValidator.DEVELOPMENT_SECRET);

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void developmentAllowsDefaultAndProductionAllowsInjectedSecret() {
        MockEnvironment development = new MockEnvironment();
        development.setActiveProfiles("dev");
        assertDoesNotThrow(() -> new ProductionJwtSecretValidator(
                development, ProductionJwtSecretValidator.DEVELOPMENT_SECRET).validate());

        MockEnvironment production = new MockEnvironment();
        production.setActiveProfiles("prod");
        assertDoesNotThrow(() -> new ProductionJwtSecretValidator(
                production, "production-secret-at-least-thirty-two-bytes").validate());
    }
}
