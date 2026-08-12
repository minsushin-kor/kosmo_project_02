package com.petpulse.app.report.client;

import com.petpulse.app.report.dto.ai.AiWeeklyReportRequest;
import com.petpulse.app.report.dto.ai.AiWeeklyReportResponse;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Component
public class FastApiWeeklyReportClient {

    private final RestClient restClient;

    public FastApiWeeklyReportClient() {

        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);

        this.restClient = RestClient.builder()
                .baseUrl("http://127.0.0.1:8000")
                .requestFactory(requestFactory)
                .build();
    }

    public AiWeeklyReportResponse generateWeeklyReport(
            AiWeeklyReportRequest request) {

        AiWeeklyReportResponse response = restClient
                .post()
                .uri("/ai/generate-weekly-report")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AiWeeklyReportResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                    "FastAPI 주간 리포트 응답이 비어 있습니다.");
        }

        return response;
    }
}