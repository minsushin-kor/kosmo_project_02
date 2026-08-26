package com.petpulse.app.weather.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class WeatherRestClientFactory {
    private final Duration connectTimeout;
    private final Duration readTimeout;

    public WeatherRestClientFactory(
            @Value("${weather.api.connect-timeout-seconds}") long connectTimeoutSeconds,
            @Value("${weather.api.read-timeout-seconds}") long readTimeoutSeconds) {
        if (connectTimeoutSeconds <= 0 || readTimeoutSeconds <= 0) {
            throw new IllegalArgumentException("날씨 API timeout은 0보다 커야 합니다.");
        }
        this.connectTimeout = Duration.ofSeconds(connectTimeoutSeconds);
        this.readTimeout = Duration.ofSeconds(readTimeoutSeconds);
    }

    public RestClient create(String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(connectTimeout)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(readTimeout);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }
}
