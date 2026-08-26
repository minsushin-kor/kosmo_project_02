package com.petpulse.app.weather.client;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

@Component
public class KakaoLocalClient {
    private final RestClient restClient;
    private final String apiKey;

    public KakaoLocalClient(
            WeatherRestClientFactory factory,
            @Value("${weather.kakao-local.base-url}") String baseUrl,
            @Value("${weather.kakao-local.rest-api-key}") String apiKey) {
        this.restClient = factory.create(baseUrl);
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    public LocationInfo resolveAddress(String query) {
        if (apiKey.isBlank()) {
            throw unavailable();
        }
        if (query == null || query.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "조회할 지역을 입력해 주세요.");
        }

        try {
            JsonNode response = restClient.get()
                    .uri(builder -> builder.path("/search/address.json")
                            .queryParam("query", query.trim())
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + apiKey)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode documents = response == null ? null : response.path("documents");
            if (documents == null || !documents.isArray() || documents.isEmpty()) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST,
                        "입력한 지역을 찾을 수 없습니다. 시·군·구 또는 도로명 주소를 확인해 주세요.");
            }

            JsonNode document = documents.get(0);
            JsonNode address = document.path("address");
            if (address.isMissingNode() || address.isNull()) {
                address = document.path("road_address");
            }

            String region1 = address.path("region_1depth_name").asText("");
            String region2 = address.path("region_2depth_name").asText("");
            String region3 = address.path("region_3depth_name").asText("");
            double longitude = Double.parseDouble(document.path("x").asText());
            double latitude = Double.parseDouble(document.path("y").asText());
            String displayLocation = joinRegions(region1, region2, region3);

            return new LocationInfo(displayLocation, region1, region2, region3,
                    latitude, longitude);
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException | NumberFormatException exception) {
            throw unavailable();
        }
    }

    private String joinRegions(String region1, String region2, String region3) {
        String joined = String.join(" ", region1, region2, region3).trim();
        return joined.isBlank() ? "조회한 지역" : joined;
    }

    private BusinessException unavailable() {
        return new BusinessException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                "지역 정보를 확인하는 서비스를 일시적으로 사용할 수 없습니다.");
    }

    public record LocationInfo(
            String displayLocation,
            String region1,
            String region2,
            String region3,
            double latitude,
            double longitude) {
    }
}
