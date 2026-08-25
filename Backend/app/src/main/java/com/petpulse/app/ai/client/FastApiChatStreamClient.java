package com.petpulse.app.ai.client;

import com.petpulse.app.ai.dto.ChatStreamRequest;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class FastApiChatStreamClient {
    private static final String CHAT_PATH = "/ai/chat/stream";

    private final URI endpoint;
    private final int connectTimeoutMillis;
    private final int readTimeoutMillis;
    private final ObjectMapper objectMapper;

    public FastApiChatStreamClient(
            @Value("${ai.fastapi.base-url}") String baseUrl,
            @Value("${ai.fastapi.connect-timeout-seconds}") long connectTimeoutSeconds,
            @Value("${ai.fastapi.chat.read-timeout-seconds}") long readTimeoutSeconds,
            ObjectMapper objectMapper) {
        if (connectTimeoutSeconds <= 0 || readTimeoutSeconds <= 0) {
            throw new IllegalArgumentException("FastAPI Chat timeout은 0보다 커야 합니다.");
        }
        this.endpoint = URI.create(baseUrl.replaceAll("/+$", "") + CHAT_PATH);
        this.connectTimeoutMillis = timeoutMillis(connectTimeoutSeconds);
        this.readTimeoutMillis = timeoutMillis(readTimeoutSeconds);
        this.objectMapper = objectMapper;
    }

    public UpstreamSseStream open(ChatStreamRequest request) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) endpoint.toURL().openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(connectTimeoutMillis);
            connection.setReadTimeout(readTimeoutMillis);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", MediaType.APPLICATION_JSON_VALUE);
            connection.setRequestProperty("Accept", MediaType.TEXT_EVENT_STREAM_VALUE);
            try (var requestBody = connection.getOutputStream()) {
                requestBody.write(objectMapper.writeValueAsBytes(request));
            }

            int status = connection.getResponseCode();
            String contentType = connection.getContentType();
            if (status < 200 || status >= 300
                    || contentType == null
                    || !contentType.toLowerCase().startsWith(MediaType.TEXT_EVENT_STREAM_VALUE)) {
                connection.disconnect();
                throw gatewayError();
            }

            return new UpstreamSseStream(connection.getInputStream(), connection);
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            if (connection != null) {
                connection.disconnect();
            }
            throw gatewayError();
        }
    }

    private static int timeoutMillis(long seconds) {
        return Math.toIntExact(Duration.ofSeconds(seconds).toMillis());
    }

    private static BusinessException gatewayError() {
        return new BusinessException(
                ErrorCode.EXTERNAL_SERVICE_ERROR,
                "AI 챗봇 서비스를 일시적으로 사용할 수 없습니다.");
    }

    public static final class UpstreamSseStream implements AutoCloseable {
        private final InputStream inputStream;
        private final HttpURLConnection connection;

        private UpstreamSseStream(InputStream inputStream, HttpURLConnection connection) {
            this.inputStream = inputStream;
            this.connection = connection;
        }

        public InputStream inputStream() {
            return inputStream;
        }

        @Override
        public void close() throws IOException {
            try {
                inputStream.close();
            } finally {
                connection.disconnect();
            }
        }
    }
}
