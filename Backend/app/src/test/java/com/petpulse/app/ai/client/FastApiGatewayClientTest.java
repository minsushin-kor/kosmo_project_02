package com.petpulse.app.ai.client;

import com.petpulse.app.ai.dto.FoodRecommendationRequest;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.prediction.client.FastApiHealthPredictionClient;
import com.petpulse.app.prediction.dto.ai.AiHealthRiskRequest;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FastApiGatewayClientTest {
    private HttpServer server;
    private FastApiHealthPredictionClient predictionClient;
    private FastApiFoodRecommendationClient foodClient;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.start();
        FastApiRestClientFactory factory = new FastApiRestClientFactory(
                "http://127.0.0.1:" + server.getAddress().getPort());
        predictionClient = new FastApiHealthPredictionClient(factory);
        foodClient = new FastApiFoodRecommendationClient(factory);
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void mapsQuickPredictionRequestAndResponse() {
        server.createContext("/ai/predict-health-risk", exchange -> {
            assertThat(readBody(exchange)).contains("\"species\":\"DOG\"");
            respond(exchange, 200, """
                    {"abnormalProbability":0.42,"riskGrade":"WATCH","primaryRiskFactor":"체온"}
                    """);
        });

        var response = predictionClient.predictHealthRisk(predictionRequest());
        assertThat(response.abnormalProbability()).isEqualTo(0.42);
        assertThat(response.riskGrade()).isEqualTo("WATCH");
    }

    @Test
    void mapsFoodRecommendationRequestAndResponse() {
        server.createContext("/ai/recommend-food", exchange -> {
            assertThat(readBody(exchange)).contains("\"petName\":\"초코\"");
            respond(exchange, 200, """
                    {"petSummary":"초코 요약","recommendedIngredients":[{"name":"연어","reason":"오메가3"}],
                    "avoidIngredients":["닭고기"],"feedingTips":["천천히 교체"],"vetNote":"상담 권장"}
                    """);
        });

        var response = foodClient.recommend(new FoodRecommendationRequest(
                "초코", "DOG", 3, 5.5, "피부", "건식", "닭고기 주의"));
        assertThat(response.recommendedIngredients()).singleElement()
                .extracting(ingredient -> ingredient.name()).isEqualTo("연어");
    }

    @Test
    void convertsFastApiFailureToCommonGatewayError() {
        server.createContext("/ai/predict-health-risk", exchange -> respond(exchange, 422, "{}"));
        server.createContext("/ai/recommend-food", exchange -> respond(exchange, 500, "{}"));

        assertGatewayFailure(() -> predictionClient.predictHealthRisk(predictionRequest()));
        assertGatewayFailure(() -> foodClient.recommend(new FoodRecommendationRequest(
                "초코", "DOG", 3, 5.5, null, null, null)));
    }

    private AiHealthRiskRequest predictionRequest() {
        return new AiHealthRiskRequest("DOG", 3, 5.5, 38.5, 100, 24,
                false, false, false, false, false,
                "NORMAL", "NORMAL", "NORMAL", 0);
    }

    private void assertGatewayFailure(Runnable call) {
        assertThatThrownBy(call::run)
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.EXTERNAL_SERVICE_ERROR));
    }

    private String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
