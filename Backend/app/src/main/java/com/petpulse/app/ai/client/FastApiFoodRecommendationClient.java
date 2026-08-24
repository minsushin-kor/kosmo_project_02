package com.petpulse.app.ai.client;

import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class FastApiFoodRecommendationClient {
    private final RestClient restClient;

    public FastApiFoodRecommendationClient(FastApiRestClientFactory factory) {
        this.restClient = factory.create();
    }

    public FoodRecommendationResponse recommend(FoodRecommendationRequest request) {
        try {
            FoodRecommendationResponse response = restClient.post()
                    .uri("/ai/recommend-food")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(FoodRecommendationResponse.class);
            if (response == null) {
                throw gatewayFailure();
            }
            return response;
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw gatewayFailure();
        }
    }

    private BusinessException gatewayFailure() {
        return new BusinessException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                "AI 사료 추천 서비스를 일시적으로 사용할 수 없습니다.");
    }
}
