package com.petpulse.app.weather.client;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.weather.service.KmaGridConverter.GridPoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.net.URI;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class KmaWeatherClient {
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HHmm");
    private static final int[] VILLAGE_BASE_HOURS = {2, 5, 8, 11, 14, 17, 20, 23};

    private final RestClient restClient;
    private final String baseUrl;
    private final String encodedServiceKey;

    public KmaWeatherClient(
            WeatherRestClientFactory factory,
            @Value("${weather.kma.base-url}") String baseUrl,
            @Value("${weather.kma.service-key}") String serviceKey) {
        this.restClient = factory.create(baseUrl);
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.encodedServiceKey = PublicDataApiKey.encode(serviceKey);
    }

    public WeatherData fetch(GridPoint grid) {
        if (encodedServiceKey.isBlank()) {
            throw unavailable();
        }

        ZonedDateTime now = ZonedDateTime.now(KOREA_ZONE);
        try {
            LocalDateTime ultraBase = now.toLocalDateTime().minusMinutes(20)
                    .withMinute(0).withSecond(0).withNano(0);
            JsonNode currentItems = requestItems("/getUltraSrtNcst", ultraBase, grid);
            Map<String, String> current = valuesByCategory(currentItems, "obsrValue");

            LocalDateTime villageBase = latestVillageBase(now.toLocalDateTime());
            JsonNode forecastItems = requestItems("/getVilageFcst", villageBase, grid);
            Map<String, String> forecast = nearestForecastValues(forecastItems,
                    now.toLocalDateTime());

            double temperature = parseNumber(current.get("T1H"),
                    parseNumber(forecast.get("TMP"), 0.0));
            double precipitationAmount = Math.max(
                    parsePrecipitation(current.get("RN1")),
                    parsePrecipitation(forecast.get("PCP")));
            int precipitationProbability = (int) Math.round(parseNumber(forecast.get("POP"), 0.0));
            double windSpeed = parseNumber(current.get("WSD"),
                    parseNumber(forecast.get("WSD"), 0.0));
            int currentPrecipitationType = (int) Math.round(parseNumber(current.get("PTY"), 0.0));
            int forecastPrecipitationType = (int) Math.round(parseNumber(forecast.get("PTY"), 0.0));
            boolean raining = currentPrecipitationType > 0
                    || precipitationAmount > 0.0
                    || (forecastPrecipitationType > 0 && precipitationProbability >= 50);

            return new WeatherData(temperature, precipitationProbability,
                    precipitationAmount, windSpeed, raining, ultraBase);
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException | DateTimeParseException | NumberFormatException exception) {
            throw unavailable();
        }
    }

    private JsonNode requestItems(String path, LocalDateTime base, GridPoint grid) {
        String uri = baseUrl + path
                + "?serviceKey=" + encodedServiceKey
                + "&pageNo=1&numOfRows=1000&dataType=JSON"
                + "&base_date=" + base.format(DATE_FORMAT)
                + "&base_time=" + base.format(TIME_FORMAT)
                + "&nx=" + grid.x()
                + "&ny=" + grid.y();
        JsonNode body = restClient.get()
                .uri(URI.create(uri))
                .retrieve()
                .body(JsonNode.class);

        JsonNode response = body == null ? null : body.path("response");
        String resultCode = response == null ? "" : response.path("header").path("resultCode").asText();
        JsonNode items = response == null ? null : response.path("body").path("items").path("item");
        if (!"00".equals(resultCode) || items == null || !items.isArray() || items.isEmpty()) {
            throw unavailable();
        }
        return items;
    }

    private Map<String, String> valuesByCategory(JsonNode items, String valueField) {
        Map<String, String> values = new HashMap<>();
        for (JsonNode item : items) {
            values.put(item.path("category").asText(), item.path(valueField).asText());
        }
        return values;
    }

    private Map<String, String> nearestForecastValues(JsonNode items, LocalDateTime now) {
        Map<LocalDateTime, Map<String, String>> byTime = new LinkedHashMap<>();
        for (JsonNode item : items) {
            LocalDate date = LocalDate.parse(item.path("fcstDate").asText(), DATE_FORMAT);
            LocalTime time = LocalTime.parse(item.path("fcstTime").asText(), TIME_FORMAT);
            byTime.computeIfAbsent(LocalDateTime.of(date, time), ignored -> new HashMap<>())
                    .put(item.path("category").asText(), item.path("fcstValue").asText());
        }

        LocalDateTime target = now.withMinute(0).withSecond(0).withNano(0);
        if (now.getMinute() > 0) {
            target = target.plusHours(1);
        }
        final LocalDateTime forecastTarget = target;

        return byTime.entrySet().stream()
                .filter(entry -> !entry.getKey().isBefore(forecastTarget))
                .min(Map.Entry.comparingByKey())
                .or(() -> byTime.entrySet().stream().min(Comparator.comparing(Map.Entry::getKey)))
                .map(Map.Entry::getValue)
                .orElseThrow(this::unavailable);
    }

    private LocalDateTime latestVillageBase(LocalDateTime now) {
        LocalDateTime available = now.minusMinutes(15);
        for (int index = VILLAGE_BASE_HOURS.length - 1; index >= 0; index--) {
            int hour = VILLAGE_BASE_HOURS[index];
            if (available.getHour() >= hour) {
                return available.toLocalDate().atTime(hour, 0);
            }
        }
        return available.toLocalDate().minusDays(1).atTime(23, 0);
    }

    private double parsePrecipitation(String value) {
        if (value == null || value.isBlank() || value.contains("강수없음") || "-".equals(value)) {
            return 0.0;
        }
        String number = value.replaceAll("[^0-9.]", " ").trim().split("\\s+")[0];
        return number.isBlank() ? 0.0 : Double.parseDouble(number);
    }

    private double parseNumber(String value, double fallback) {
        if (value == null || value.isBlank() || "-".equals(value)) {
            return fallback;
        }
        return Double.parseDouble(value);
    }

    private BusinessException unavailable() {
        return new BusinessException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                "기상청 날씨 정보를 일시적으로 불러올 수 없습니다.");
    }

    public record WeatherData(
            double temperature,
            int precipitationProbability,
            double precipitationAmount,
            double windSpeed,
            boolean raining,
            LocalDateTime observedAt) {
    }
}
