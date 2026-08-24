package com.petpulse.app.global.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WebConfigTest {

    @Test
    void acceptsCommaSeparatedOriginsAndEmptyProductionValue() {
        assertThatCode(() -> new WebConfig(
                "http://localhost:5173, http://127.0.0.1:5173"))
                .doesNotThrowAnyException();
        assertThatCode(() -> new WebConfig(""))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsWildcardOrigin() {
        assertThatThrownBy(() -> new WebConfig("*"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("wildcard");
    }
}
