package com.petpulse.app.ai.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class FastApiRestClientFactory {
    private final String baseUrl;
    private final Duration connectTimeout;
    private final Duration readTimeout;

    public FastApiRestClientFactory(
            @Value("${ai.fastapi.base-url}") String baseUrl,
            @Value("${ai.fastapi.connect-timeout-seconds}") long connectTimeoutSeconds,
            @Value("${ai.fastapi.read-timeout-seconds}") long readTimeoutSeconds) {
        if (connectTimeoutSeconds <= 0 || readTimeoutSeconds <= 0) {
            throw new IllegalArgumentException("FastAPI timeout은 0보다 커야 합니다.");
        }
        this.baseUrl = baseUrl;
        this.connectTimeout = Duration.ofSeconds(connectTimeoutSeconds);
        this.readTimeout = Duration.ofSeconds(readTimeoutSeconds);
    }

    public RestClient create() {
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
