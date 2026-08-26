package com.petpulse.app.weather.client;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

final class PublicDataApiKey {
    private PublicDataApiKey() {
    }

    static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String trimmed = value.trim();
        return trimmed.contains("%")
                ? URLDecoder.decode(trimmed, StandardCharsets.UTF_8)
                : trimmed;
    }

    static String encode(String value) {
        return URLEncoder.encode(normalize(value), StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}
