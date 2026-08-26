package com.petpulse.app.weather.controller;

import com.petpulse.app.global.exception.GlobalExceptionHandler;
import com.petpulse.app.weather.dto.WalkAdviceResponse;
import com.petpulse.app.weather.service.WalkAdviceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WalkAdviceControllerTest {
    private WalkAdviceService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(WalkAdviceService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new WalkAdviceController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returnsWalkAdviceForAuthenticatedUserAndRequestedLocation() throws Exception {
        when(service.getAdvice("guardian", 1L, "부산 해운대구")).thenReturn(
                new WalkAdviceResponse(1L, "GOOD", 92,
                        "부산광역시 해운대구", "SEARCHED", "8월 26일 14:00 기준",
                        24.0, 10, 0.0, 2.0, "좋음", 20, 10,
                        "산책하기 무난해요."));

        mockMvc.perform(get("/api/walk-advice")
                        .param("petId", "1")
                        .param("location", "부산 해운대구")
                        .principal(new UsernamePasswordAuthenticationToken("guardian", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recommendationScore").value(92))
                .andExpect(jsonPath("$.data.locationSource").value("SEARCHED"));
    }
}
