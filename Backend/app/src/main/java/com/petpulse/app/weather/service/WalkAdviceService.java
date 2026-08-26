package com.petpulse.app.weather.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.weather.client.AirKoreaClient;
import com.petpulse.app.weather.client.AirKoreaClient.AirQualityData;
import com.petpulse.app.weather.client.KakaoLocalClient;
import com.petpulse.app.weather.client.KakaoLocalClient.LocationInfo;
import com.petpulse.app.weather.client.KmaWeatherClient;
import com.petpulse.app.weather.client.KmaWeatherClient.WeatherData;
import com.petpulse.app.weather.dto.WalkAdviceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkAdviceService {
    private static final int MAX_LOCATION_LENGTH = 120;
    private static final DateTimeFormatter OBSERVED_AT_FORMAT =
            DateTimeFormatter.ofPattern("M월 d일 HH:mm 기준");

    private final PetAccessService petAccessService;
    private final KakaoLocalClient kakaoLocalClient;
    private final KmaGridConverter gridConverter;
    private final KmaWeatherClient kmaWeatherClient;
    private final AirKoreaClient airKoreaClient;

    public WalkAdviceResponse getAdvice(String loginId, Long petId, String requestedLocation) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        boolean customLocation = requestedLocation != null && !requestedLocation.isBlank();
        String address = customLocation ? requestedLocation.trim() : pet.getUser().getAddress();

        if (address == null || address.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    "등록된 주소가 없습니다. 마이페이지에서 주소를 등록하거나 다른 지역을 검색해 주세요.");
        }
        if (address.length() > MAX_LOCATION_LENGTH) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    "지역 검색어는 120자 이하로 입력해 주세요.");
        }

        LocationInfo location = kakaoLocalClient.resolveAddress(address);
        KmaGridConverter.GridPoint grid = gridConverter.convert(
                location.latitude(), location.longitude());
        WeatherData weather = kmaWeatherClient.fetch(grid);
        AirQualityData airQuality = airKoreaClient.fetch(location);
        Recommendation recommendation = calculateRecommendation(weather, airQuality);

        return new WalkAdviceResponse(
                petId,
                recommendation.condition(),
                recommendation.score(),
                location.displayLocation(),
                customLocation ? "SEARCHED" : "MEMBER_ADDRESS",
                weather.observedAt().format(OBSERVED_AT_FORMAT),
                roundOneDecimal(weather.temperature()),
                weather.precipitationProbability(),
                roundOneDecimal(weather.precipitationAmount()),
                roundOneDecimal(weather.windSpeed()),
                airQuality.label(),
                airQuality.pm10(),
                airQuality.pm25(),
                recommendation.reason());
    }

    Recommendation calculateRecommendation(WeatherData weather, AirQualityData airQuality) {
        int score = 100;
        boolean restRequired = false;
        boolean cautionRequired = false;
        List<String> reasons = new ArrayList<>();

        if (weather.raining() || weather.precipitationAmount() > 0.0) {
            score -= 60;
            restRequired = true;
            reasons.add("현재 비나 눈이 내려 바깥 활동이 불편해요.");
        } else if (weather.precipitationProbability() >= 70) {
            score -= 40;
            reasons.add("강수 가능성이 높아 우산이 필요할 수 있어요.");
        } else if (weather.precipitationProbability() >= 40) {
            score -= 20;
            reasons.add("강수 가능성이 있어 가까운 곳을 추천해요.");
        } else if (weather.precipitationProbability() >= 20) {
            score -= 8;
            reasons.add("약한 비 가능성이 있으니 하늘을 확인해 주세요.");
        }

        double temperature = weather.temperature();
        if (temperature >= 32) {
            score -= 45;
            restRequired = true;
            reasons.add("기온이 매우 높아 한낮 산책은 피하는 것이 좋아요.");
        } else if (temperature <= -5) {
            score -= 45;
            restRequired = true;
            reasons.add("기온이 매우 낮아 야외 활동은 피하는 것이 좋아요.");
        } else if (temperature >= 28) {
            score -= 25;
            reasons.add("기온이 높아 그늘이 있는 짧은 동선을 추천해요.");
        } else if (temperature <= 3) {
            score -= 25;
            reasons.add("쌀쌀한 날씨라 가볍고 짧은 산책이 좋아요.");
        } else if (temperature >= 25 || temperature <= 8) {
            score -= 10;
            reasons.add("기온 변화에 맞춰 산책 시간을 조절해 주세요.");
        }

        if (weather.windSpeed() >= 10) {
            score -= 25;
            cautionRequired = true;
            reasons.add("바람이 강해 야외 활동에 주의가 필요해요.");
        } else if (weather.windSpeed() >= 7) {
            score -= 10;
            reasons.add("바람이 다소 강하니 주변을 살펴 주세요.");
        }

        switch (airQuality.label()) {
            case "매우 나쁨" -> {
                score -= 55;
                restRequired = true;
                reasons.add("대기질이 매우 나빠 실내 활동을 추천해요.");
            }
            case "나쁨" -> {
                score -= 35;
                reasons.add("미세먼지가 나빠 긴 산책은 피하는 것이 좋아요.");
            }
            case "보통" -> score -= 5;
            default -> {
                // 좋음 또는 정보 없음은 감점하지 않습니다.
            }
        }

        int normalizedScore = Math.max(0, Math.min(100, score));
        if (restRequired) {
            normalizedScore = Math.min(normalizedScore, 44);
        } else if (cautionRequired) {
            normalizedScore = Math.min(normalizedScore, 74);
        }
        String condition = normalizedScore >= 75
                ? "GOOD"
                : normalizedScore >= 45 ? "CAUTION" : "REST";
        if (reasons.isEmpty()) {
            reasons.add("기온과 강수, 대기질이 산책하기 무난해요.");
        }

        return new Recommendation(normalizedScore, condition, String.join(" ", reasons));
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    record Recommendation(int score, String condition, String reason) {
    }
}
