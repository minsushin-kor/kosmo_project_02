package com.petpulse.app.prediction.client;

import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Component
public class FastApiHealthPredictionClient {

    private final RestClient restClient;

    public FastApiHealthPredictionClient() {

        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);

        this.restClient = RestClient.builder()
                .baseUrl("http://127.0.0.1:8000")
                .requestFactory(requestFactory)
                .build();
    }

    public AiHealthRiskResponse predictHealthRisk(
            AiHealthRiskRequest request) {

        AiHealthRiskResponse response = restClient
                .post()
                .uri("/ai/predict-health-risk")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AiHealthRiskResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                    "FastAPI 예측 응답이 비어 있습니다.");
        }

        return response;
    }
}