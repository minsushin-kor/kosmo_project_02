package com.petpulse.app.prediction.client;

import com.petpulse.app.prediction.dto.ai.AiExplainPredictionRequest;
import com.petpulse.app.prediction.dto.ai.AiExplainPredictionResponse;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import org.springframework.http.MediaType;
import com.petpulse.app.ai.client.FastApiRestClientFactory;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import org.springframework.web.client.RestClientException;

@Component
public class FastApiHealthPredictionClient {

    private final RestClient restClient;

    public FastApiHealthPredictionClient(FastApiRestClientFactory factory) {
        this.restClient = factory.create();
    }

    public AiHealthRiskResponse predictHealthRisk(
            AiHealthRiskRequest request) {

        try {
            AiHealthRiskResponse response = restClient
                    .post()
                    .uri("/ai/predict-health-risk")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiHealthRiskResponse.class);
            if (response == null) {
                throw gatewayFailure("AI 건강 예측");
            }
            return response;
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw gatewayFailure("AI 건강 예측");
        }
    }

    public AiExplainPredictionResponse explainPrediction(
            AiExplainPredictionRequest request) {

        AiExplainPredictionResponse response = restClient
                .post()
                .uri("/ai/explain-prediction")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AiExplainPredictionResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                    "FastAPI 예측 설명 응답이 비어 있습니다.");
        }

        return response;
    }

    private BusinessException gatewayFailure(String serviceName) {
        return new BusinessException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                serviceName + " 서비스를 일시적으로 사용할 수 없습니다.");
    }
}
