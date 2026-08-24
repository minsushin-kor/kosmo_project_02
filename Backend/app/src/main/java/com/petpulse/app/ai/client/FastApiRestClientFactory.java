package com.petpulse.app.ai.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Component
public class FastApiRestClientFactory {
    private final String baseUrl;

    public FastApiRestClientFactory(@Value("${ai.fastapi.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public RestClient create() {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
    }
}
