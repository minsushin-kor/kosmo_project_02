package com.petpulse.app.weather.service;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import com.petpulse.app.weather.client.AirKoreaClient;
import com.petpulse.app.weather.client.AirKoreaClient.AirQualityData;
import com.petpulse.app.weather.client.KakaoLocalClient;
import com.petpulse.app.weather.client.KakaoLocalClient.LocationInfo;
import com.petpulse.app.weather.client.KmaWeatherClient;
import com.petpulse.app.weather.client.KmaWeatherClient.WeatherData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalkAdviceServiceTest {
    private PetAccessService petAccessService;
    private KakaoLocalClient kakaoLocalClient;
    private KmaGridConverter gridConverter;
    private KmaWeatherClient kmaWeatherClient;
    private AirKoreaClient airKoreaClient;
    private WalkAdviceService service;

    @BeforeEach
    void setUp() {
        petAccessService = mock(PetAccessService.class);
        kakaoLocalClient = mock(KakaoLocalClient.class);
        gridConverter = mock(KmaGridConverter.class);
        kmaWeatherClient = mock(KmaWeatherClient.class);
        airKoreaClient = mock(AirKoreaClient.class);
        service = new WalkAdviceService(petAccessService, kakaoLocalClient,
                gridConverter, kmaWeatherClient, airKoreaClient);
    }

    @Test
    void usesMemberAddressAndCalculatesAdviceFromWeatherOnly() {
        Pet pet = petWithAddress("서울특별시 종로구 세종대로 1");
        LocationInfo location = new LocationInfo("서울특별시 종로구 청운동",
                "서울", "종로구", "청운동", 37.58, 126.97);
        var grid = new KmaGridConverter.GridPoint(60, 127);

        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(kakaoLocalClient.resolveAddress("서울특별시 종로구 세종대로 1"))
                .thenReturn(location);
        when(gridConverter.convert(37.58, 126.97)).thenReturn(grid);
        when(kmaWeatherClient.fetch(grid)).thenReturn(new WeatherData(
                21.5, 10, 0.0, 2.0, false,
                LocalDateTime.of(2026, 8, 26, 14, 0)));
        when(airKoreaClient.fetch(location)).thenReturn(new AirQualityData(
                "좋음", 20, 10, "2026-08-26 14:00", "종로구"));

        var response = service.getAdvice("guardian", 1L, null);

        assertThat(response.condition()).isEqualTo("GOOD");
        assertThat(response.recommendationScore()).isEqualTo(100);
        assertThat(response.locationSource()).isEqualTo("MEMBER_ADDRESS");
        assertThat(response.location()).isEqualTo("서울특별시 종로구 청운동");
        verify(kakaoLocalClient).resolveAddress("서울특별시 종로구 세종대로 1");
    }

    @Test
    void customLocationDoesNotChangeOrUseMemberAddress() {
        Pet pet = petWithAddress("서울특별시 종로구 세종대로 1");
        LocationInfo location = new LocationInfo("부산광역시 해운대구 우동",
                "부산", "해운대구", "우동", 35.16, 129.16);
        var grid = new KmaGridConverter.GridPoint(99, 75);

        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
        when(kakaoLocalClient.resolveAddress("부산 해운대구 우동")).thenReturn(location);
        when(gridConverter.convert(35.16, 129.16)).thenReturn(grid);
        when(kmaWeatherClient.fetch(grid)).thenReturn(new WeatherData(
                29.0, 80, 0.0, 3.0, false,
                LocalDateTime.of(2026, 8, 26, 14, 0)));
        when(airKoreaClient.fetch(location)).thenReturn(new AirQualityData(
                "나쁨", 100, 40, "2026-08-26 14:00", "해운대"));

        var response = service.getAdvice("guardian", 1L, " 부산 해운대구 우동 ");

        assertThat(response.locationSource()).isEqualTo("SEARCHED");
        assertThat(response.condition()).isEqualTo("REST");
        assertThat(response.recommendationScore()).isLessThan(45);
        verify(kakaoLocalClient).resolveAddress("부산 해운대구 우동");
    }

    @Test
    void rainProducesRestRecommendation() {
        var recommendation = service.calculateRecommendation(
                new WeatherData(18.0, 80, 3.0, 4.0, true,
                        LocalDateTime.of(2026, 8, 26, 14, 0)),
                new AirQualityData("좋음", 15, 8, "", ""));

        assertThat(recommendation.condition()).isEqualTo("REST");
        assertThat(recommendation.reason()).contains("비나 눈");
    }

    @Test
    void veryBadAirQualityAlwaysProducesRestRecommendation() {
        var recommendation = service.calculateRecommendation(
                new WeatherData(20.0, 0, 0.0, 2.0, false,
                        LocalDateTime.of(2026, 8, 26, 14, 0)),
                new AirQualityData("매우 나쁨", 160, 80, "", ""));

        assertThat(recommendation.score()).isEqualTo(44);
        assertThat(recommendation.condition()).isEqualTo("REST");
    }

    @Test
    void extremeTemperatureAlwaysProducesRestRecommendation() {
        var recommendation = service.calculateRecommendation(
                new WeatherData(33.0, 0, 0.0, 2.0, false,
                        LocalDateTime.of(2026, 8, 26, 14, 0)),
                new AirQualityData("좋음", 15, 8, "", ""));

        assertThat(recommendation.score()).isEqualTo(44);
        assertThat(recommendation.condition()).isEqualTo("REST");
    }

    @Test
    void strongWindCannotProduceGoodRecommendation() {
        var recommendation = service.calculateRecommendation(
                new WeatherData(20.0, 0, 0.0, 10.0, false,
                        LocalDateTime.of(2026, 8, 26, 14, 0)),
                new AirQualityData("좋음", 15, 8, "", ""));

        assertThat(recommendation.score()).isEqualTo(74);
        assertThat(recommendation.condition()).isEqualTo("CAUTION");
    }

    @Test
    void highRainProbabilityWithoutCurrentRainProducesCautionRecommendation() {
        var recommendation = service.calculateRecommendation(
                new WeatherData(20.0, 75, 0.0, 2.0, false,
                        LocalDateTime.of(2026, 8, 26, 14, 0)),
                new AirQualityData("좋음", 15, 8, "", ""));

        assertThat(recommendation.score()).isEqualTo(60);
        assertThat(recommendation.condition()).isEqualTo("CAUTION");
    }

    private Pet petWithAddress(String address) {
        User user = new User("guardian", "encoded", "guardian@example.com",
                "보호자", null, UserRole.USER);
        user.updateAddress("03172", address, "101호");
        return new Pet(user, "초코", PetSpecies.DOG, "말티즈",
                LocalDate.of(2022, 1, 1), PetGender.MALE,
                BigDecimal.valueOf(4.5), true, "관절 주의", null);
    }
}
