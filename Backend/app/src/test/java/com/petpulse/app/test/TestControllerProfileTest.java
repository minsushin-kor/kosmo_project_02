package com.petpulse.app.test;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;

import static org.assertj.core.api.Assertions.assertThat;

class TestControllerProfileTest {

    @Test
    void testControllerIsNotRegisteredInProductionProfile() {
        Profile profile = TestController.class.getAnnotation(Profile.class);

        assertThat(profile).isNotNull();
        assertThat(profile.value()).containsExactly("!prod");
    }
}
