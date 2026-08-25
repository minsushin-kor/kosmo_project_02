package com.petpulse.app.ai.client;

import com.petpulse.app.ai.dto.ChatStreamRequest;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FastApiChatStreamClientTest {
    private HttpServer server;
    private FastApiChatStreamClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.start();
        client = new FastApiChatStreamClient(
                "http://127.0.0.1:" + server.getAddress().getPort(),
                3,
                30,
                new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void forwardsJsonRequestAndStreamsSseBytes() throws Exception {
        server.createContext("/ai/chat/stream", exchange -> {
            assertThat(exchange.getRequestMethod()).isEqualTo("POST");
            assertThat(exchange.getRequestHeaders().getFirst("Accept")).isEqualTo("text/event-stream");
            assertThat(readBody(exchange)).contains("\"message\":\"산책량이 적당한가요?\"")
                    .contains("\"species\":\"DOG\"");
            byte[] bytes = ("data: {\"type\":\"token\",\"content\":\"안녕\"}\n\n"
                    + "data: {\"type\":\"done\",\"sources\":[]}\n\n")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream; charset=utf-8");
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });

        try (var stream = client.open(new ChatStreamRequest("산책량이 적당한가요?", "DOG"))) {
            String body = new String(stream.inputStream().readAllBytes(), StandardCharsets.UTF_8);
            assertThat(body).contains("\"type\":\"token\"").contains("\"type\":\"done\"");
        }
    }

    @Test
    void convertsUpstreamErrorToCommonGatewayError() {
        server.createContext("/ai/chat/stream", exchange -> {
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });

        assertThatThrownBy(() -> client.open(new ChatStreamRequest("질문", "DOG")))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.EXTERNAL_SERVICE_ERROR));
    }

    private String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }
}
