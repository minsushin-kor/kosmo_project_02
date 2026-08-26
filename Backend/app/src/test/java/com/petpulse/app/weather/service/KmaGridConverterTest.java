package com.petpulse.app.weather.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KmaGridConverterTest {
    private final KmaGridConverter converter = new KmaGridConverter();

    @Test
    void convertsSeoulCoordinatesToKmaGrid() {
        var grid = converter.convert(37.5665, 126.9780);

        assertThat(grid.x()).isEqualTo(60);
        assertThat(grid.y()).isEqualTo(127);
    }
}
