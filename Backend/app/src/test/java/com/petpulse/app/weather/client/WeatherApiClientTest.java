package com.petpulse.app.weather.client;

import com.petpulse.app.weather.service.KmaGridConverter.GridPoint;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class WeatherApiClientTest {
    private HttpServer server;
    private String baseUrl;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.start();
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void resolvesKakaoAddressWithoutExposingKeyInPayload() {
        server.createContext("/search/address.json", exchange -> {
            assertThat(exchange.getRequestHeaders().getFirst("Authorization"))
                    .isEqualTo("KakaoAK test-kakao-key");
            respond(exchange, 200, """
                    {"documents":[{"x":"126.978","y":"37.5665","address":{
                    "region_1depth_name":"서울","region_2depth_name":"종로구",
                    "region_3depth_name":"청운동"}}]}
                    """);
        });

        var client = new KakaoLocalClient(factory(), baseUrl, "test-kakao-key");
        var result = client.resolveAddress("서울 종로구");

        assertThat(result.displayLocation()).isEqualTo("서울 종로구 청운동");
        assertThat(result.latitude()).isEqualTo(37.5665);
    }

    @Test
    void combinesKmaObservationAndForecast() {
        server.createContext("/getUltraSrtNcst", exchange -> {
            assertThat(exchange.getRequestURI().getRawQuery())
                    .contains("serviceKey=encoded%2Btest%2Fkey");
            respond(exchange, 200, """
                {"response":{"header":{"resultCode":"00"},"body":{"items":{"item":[
                {"category":"T1H","obsrValue":"22.5"},
                {"category":"RN1","obsrValue":"0"},
                {"category":"PTY","obsrValue":"0"},
                {"category":"WSD","obsrValue":"2.3"}
                ]}}}}
                """);
        });
        server.createContext("/getVilageFcst", exchange -> respond(exchange, 200, """
                {"response":{"header":{"resultCode":"00"},"body":{"items":{"item":[
                {"fcstDate":"20991231","fcstTime":"1500","category":"TMP","fcstValue":"23"},
                {"fcstDate":"20991231","fcstTime":"1500","category":"POP","fcstValue":"10"},
                {"fcstDate":"20991231","fcstTime":"1500","category":"PTY","fcstValue":"0"},
                {"fcstDate":"20991231","fcstTime":"1500","category":"PCP","fcstValue":"강수없음"}
                ]}}}}
                """));

        var client = new KmaWeatherClient(factory(), baseUrl, "encoded%2Btest%2Fkey");
        var result = client.fetch(new GridPoint(60, 127));

        assertThat(result.temperature()).isEqualTo(22.5);
        assertThat(result.precipitationProbability()).isEqualTo(10);
        assertThat(result.raining()).isFalse();
    }

    @Test
    void selectsMatchingAirKoreaStationAndWorstDustGrade() {
        server.createContext("/getCtprvnRltmMesureDnsty", exchange -> respond(exchange, 200, """
                {"response":{"header":{"resultCode":"00"},"body":{"items":[
                {"stationName":"강남구","pm10Value":"10","pm25Value":"5","pm10Grade":"1","pm25Grade":"1"},
                {"stationName":"종로구","pm10Value":"95","pm25Value":"28","pm10Grade":"3","pm25Grade":"2","dataTime":"2026-08-26 14:00"}
                ]}}}
                """));

        var client = new AirKoreaClient(factory(), baseUrl, "test-public-key");
        var location = new KakaoLocalClient.LocationInfo("서울 종로구 청운동",
                "서울", "종로구", "청운동", 37.58, 126.97);
        var result = client.fetch(location);

        assertThat(result.stationName()).isEqualTo("종로구");
        assertThat(result.label()).isEqualTo("나쁨");
        assertThat(result.pm10()).isEqualTo(95);
    }

    private WeatherRestClientFactory factory() {
        return new WeatherRestClientFactory(3, 10);
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
