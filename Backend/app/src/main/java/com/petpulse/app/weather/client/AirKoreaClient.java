package com.petpulse.app.weather.client;

import com.petpulse.app.weather.client.KakaoLocalClient.LocationInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.Locale;
import java.util.stream.StreamSupport;

@Component
public class AirKoreaClient {
    private final RestClient restClient;
    private final String baseUrl;
    private final String encodedServiceKey;

    public AirKoreaClient(
            WeatherRestClientFactory factory,
            @Value("${weather.air-korea.base-url}") String baseUrl,
            @Value("${weather.air-korea.service-key}") String serviceKey) {
        this.restClient = factory.create(baseUrl);
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.encodedServiceKey = PublicDataApiKey.encode(serviceKey);
    }

    public AirQualityData fetch(LocationInfo location) {
        if (encodedServiceKey.isBlank()) {
            return AirQualityData.unavailable();
        }

        try {
            String sido = URLEncoder.encode(normalizeSido(location.region1()),
                    StandardCharsets.UTF_8).replace("+", "%20");
            String uri = baseUrl + "/getCtprvnRltmMesureDnsty"
                    + "?serviceKey=" + encodedServiceKey
                    + "&returnType=json&numOfRows=100&pageNo=1"
                    + "&sidoName=" + sido + "&ver=1.0";
            JsonNode body = restClient.get()
                    .uri(URI.create(uri))
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode response = body == null ? null : body.path("response");
            String resultCode = response == null ? "" : response.path("header").path("resultCode").asText();
            JsonNode items = response == null ? null : response.path("body").path("items");
            if (!"00".equals(resultCode) || items == null || !items.isArray() || items.isEmpty()) {
                return AirQualityData.unavailable();
            }

            JsonNode selected = StreamSupport.stream(items.spliterator(), false)
                    .min(Comparator.comparingInt(item -> stationDistance(item, location.region2())))
                    .orElse(items.get(0));

            Integer pm10 = parseInteger(selected.path("pm10Value").asText());
            Integer pm25 = parseInteger(selected.path("pm25Value").asText());
            int pm10Grade = parseGrade(selected, "pm10Grade1h", "pm10Grade", gradePm10(pm10));
            int pm25Grade = parseGrade(selected, "pm25Grade1h", "pm25Grade", gradePm25(pm25));
            int worstGrade = Math.max(pm10Grade, pm25Grade);

            return new AirQualityData(labelForGrade(worstGrade), pm10, pm25,
                    selected.path("dataTime").asText(""),
                    selected.path("stationName").asText(""));
        } catch (RestClientException | NumberFormatException exception) {
            return AirQualityData.unavailable();
        }
    }

    private int stationDistance(JsonNode item, String district) {
        String station = item.path("stationName").asText("").toLowerCase(Locale.ROOT);
        String districtName = district == null ? "" : district.toLowerCase(Locale.ROOT);
        String core = districtName.replaceFirst("(시|군|구)$", "");
        if (!station.isBlank() && (station.contains(core) || districtName.contains(station))) {
            return 0;
        }
        return hasAirQuality(item) ? 1 : 2;
    }

    private boolean hasAirQuality(JsonNode item) {
        return parseInteger(item.path("pm10Value").asText()) != null
                || parseInteger(item.path("pm25Value").asText()) != null;
    }

    private String normalizeSido(String value) {
        if (value == null) {
            return "서울";
        }
        String normalized = value.trim();
        if (normalized.startsWith("서울")) return "서울";
        if (normalized.startsWith("부산")) return "부산";
        if (normalized.startsWith("대구")) return "대구";
        if (normalized.startsWith("인천")) return "인천";
        if (normalized.startsWith("광주")) return "광주";
        if (normalized.startsWith("대전")) return "대전";
        if (normalized.startsWith("울산")) return "울산";
        if (normalized.startsWith("세종")) return "세종";
        if (normalized.startsWith("경기")) return "경기";
        if (normalized.startsWith("강원")) return "강원";
        if (normalized.startsWith("충청북") || normalized.startsWith("충북")) return "충북";
        if (normalized.startsWith("충청남") || normalized.startsWith("충남")) return "충남";
        if (normalized.startsWith("전라북") || normalized.startsWith("전북")) return "전북";
        if (normalized.startsWith("전라남") || normalized.startsWith("전남")) return "전남";
        if (normalized.startsWith("경상북") || normalized.startsWith("경북")) return "경북";
        if (normalized.startsWith("경상남") || normalized.startsWith("경남")) return "경남";
        if (normalized.startsWith("제주")) return "제주";
        return normalized;
    }

    private int parseGrade(JsonNode item, String primary, String secondary, int fallback) {
        Integer grade = parseInteger(item.path(primary).asText());
        if (grade == null) {
            grade = parseInteger(item.path(secondary).asText());
        }
        return grade == null ? fallback : grade;
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank() || "-".equals(value)) {
            return null;
        }
        try {
            return (int) Math.round(Double.parseDouble(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private int gradePm10(Integer value) {
        if (value == null) return 0;
        if (value <= 30) return 1;
        if (value <= 80) return 2;
        if (value <= 150) return 3;
        return 4;
    }

    private int gradePm25(Integer value) {
        if (value == null) return 0;
        if (value <= 15) return 1;
        if (value <= 35) return 2;
        if (value <= 75) return 3;
        return 4;
    }

    private String labelForGrade(int grade) {
        return switch (grade) {
            case 1 -> "좋음";
            case 2 -> "보통";
            case 3 -> "나쁨";
            case 4 -> "매우 나쁨";
            default -> "정보 없음";
        };
    }

    public record AirQualityData(
            String label,
            Integer pm10,
            Integer pm25,
            String observedAt,
            String stationName) {
        public static AirQualityData unavailable() {
            return new AirQualityData("정보 없음", null, null, "", "");
        }
    }
}
