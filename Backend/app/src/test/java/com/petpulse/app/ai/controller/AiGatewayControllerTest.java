package com.petpulse.app.ai.controller;

import com.petpulse.app.ai.dto.FoodRecommendationResponse;
import com.petpulse.app.ai.service.AiGatewayService;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.global.exception.GlobalExceptionHandler;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.List;
import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class AiGatewayControllerTest {
    private AiGatewayService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(AiGatewayService.class);
        mockMvc = standaloneSetup(new AiGatewayController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void mapsQuickPredictionDto() throws Exception {
        when(service.quickPrediction(any())).thenReturn(new AiHealthRiskResponse(0.42, "WATCH", "체온"));
        mockMvc.perform(post("/api/ai/quick-predictions")
                        .contentType(MediaType.APPLICATION_JSON).content(quickRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskGrade").value("WATCH"));
    }

    @Test
    void mapsFoodRecommendationDto() throws Exception {
        var ingredient = new FoodRecommendationResponse.RecommendedIngredient("연어", "오메가3");
        when(service.foodRecommendation(any())).thenReturn(new FoodRecommendationResponse(
                "요약", List.of(ingredient), List.of(), List.of(), "상담"));
        mockMvc.perform(post("/api/ai/food-recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petName\":\"초코\",\"species\":\"DOG\",\"age\":3,\"weight\":5.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendedIngredients[0].name").value("연어"));
    }

    @Test
    void returnsCommonErrorWhenFastApiFails() throws Exception {
        when(service.quickPrediction(any())).thenThrow(new BusinessException(
                ErrorCode.EXTERNAL_SERVICE_ERROR, "AI 건강 예측 서비스를 일시적으로 사용할 수 없습니다."));
        mockMvc.perform(post("/api/ai/quick-predictions")
                        .contentType(MediaType.APPLICATION_JSON).content(quickRequest()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("EXTERNAL_SERVICE_ERROR"));
    }

    @Test
    void streamsChatSseWithExpectedContentType() throws Exception {
        StreamingResponseBody body = output -> {
            output.write("data: {\"type\":\"token\",\"content\":\"안녕\"}\n\n"
                    .getBytes(StandardCharsets.UTF_8));
            output.flush();
        };
        when(service.chatStream(any())).thenReturn(body);

        var result = mockMvc.perform(post("/api/ai/chat/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.TEXT_EVENT_STREAM)
                        .content("{\"message\":\"질문\",\"species\":\"DOG\"}"))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(header().string("X-Accel-Buffering", "no"))
                .andExpect(content().string("data: {\"type\":\"token\",\"content\":\"안녕\"}\n\n"));
    }

    private String quickRequest() {
        return """
                {"species":"DOG","age":3,"weight":5.5,"temperature":38.5,"heartRate":100,
                "respiratoryRate":24,"skinRedness":false,"itching":false,"hairLoss":false,
                "vomiting":false,"diarrhea":false,"appetiteLevel":"NORMAL",
                "waterIntakeLevel":"NORMAL","activityLevel":"NORMAL","symptomDurationDays":0}
                """;
    }
}
