package com.petpulse.app.security;

import com.petpulse.app.ai.service.AiGatewayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest
class HealthDomainSecurityIntegrationTest {
    @Autowired WebApplicationContext context;
    @MockitoBean AiGatewayService aiGatewayService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void allHealthDomainsRejectUnauthenticatedRequests() throws Exception {
        assertUnauthorized(get("/api/pets/1/vitals"));
        assertUnauthorized(get("/api/pets/1/questionnaires"));
        assertUnauthorized(get("/api/pets/1/predictions?year=2026&month=8"));
        assertUnauthorized(get("/api/pets/1/alerts"));
        assertUnauthorized(get("/api/pets/1/reports/weekly"));
        assertUnauthorized(get("/api/pets/1/diary?year=2026&month=8"));
        assertUnauthorized(get("/api/questionnaires/1"));
        assertUnauthorized(get("/api/predictions/1"));
        assertUnauthorized(get("/api/reports/1"));
        assertUnauthorized(patch("/api/alerts/1/read"));
        assertUnauthorized(post("/api/ai/quick-predictions"));
        assertUnauthorized(post("/api/ai/food-recommendations"));
        assertUnauthorized(post("/api/ai/chat/stream"));
    }

    @Test
    void unspecifiedApiIsProtectedByDefault() throws Exception {
        assertUnauthorized(get("/api/future-endpoint"));
    }

    @Test
    @WithMockUser(username = "guardian")
    void authenticatedUserCanStreamChat() throws Exception {
        StreamingResponseBody body = output -> {
            output.write("data: {\"type\":\"done\",\"sources\":[]}\n\n"
                    .getBytes(StandardCharsets.UTF_8));
            output.flush();
        };
        when(aiGatewayService.chatStream(any())).thenReturn(body);

        var result = mockMvc.perform(post("/api/ai/chat/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.TEXT_EVENT_STREAM)
                        .content("{\"message\":\"질문\",\"species\":\"DOG\"}"))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));
    }

    private void assertUnauthorized(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        mockMvc.perform(request)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("AUTHENTICATION_FAILED"));
    }
}
