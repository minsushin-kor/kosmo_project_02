package com.petpulse.app.ai.service;

import com.petpulse.app.ai.client.FastApiFoodRecommendationClient;
import com.petpulse.app.ai.client.FastApiChatStreamClient;
import com.petpulse.app.ai.dto.ChatStreamRequest;
import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class AiGatewayService {
    private final FastApiHealthPredictionClient healthPredictionClient;
    private final FastApiFoodRecommendationClient foodRecommendationClient;
    private final FastApiChatStreamClient chatStreamClient;

    public AiHealthRiskResponse quickPrediction(AiHealthRiskRequest request) {
        return healthPredictionClient.predictHealthRisk(request);
    }

    public FoodRecommendationResponse foodRecommendation(FoodRecommendationRequest request) {
        return foodRecommendationClient.recommend(request);
    }

    public StreamingResponseBody chatStream(ChatStreamRequest request) {
        FastApiChatStreamClient.UpstreamSseStream upstream = chatStreamClient.open(request);
        return outputStream -> {
            try (upstream) {
                byte[] buffer = new byte[4096];
                int length;
                while ((length = upstream.inputStream().read(buffer)) != -1) {
                    outputStream.write(buffer, 0, length);
                    outputStream.flush();
                }
            } catch (IOException exception) {
                try {
                    outputStream.write(("data: {\"type\":\"error\","
                            + "\"message\":\"챗봇 응답 연결이 종료되었습니다.\"}\n\n")
                            .getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                } catch (IOException ignored) {
                    // Browser disconnects also close the upstream connection via try-with-resources.
                }
            }
        };
    }
}
