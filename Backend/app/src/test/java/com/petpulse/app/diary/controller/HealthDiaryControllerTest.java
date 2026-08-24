package com.petpulse.app.diary.controller;

import com.petpulse.app.diary.service.HealthDiaryService;
import com.petpulse.app.global.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

class HealthDiaryControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        HealthDiaryService healthDiaryService = mock(HealthDiaryService.class);
        HealthDiaryController controller = new HealthDiaryController(healthDiaryService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void statusOtherThanGoodOrWatchReturnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/pets/1/diary/2026-08-18")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                {"status":"BAD","note":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("HttpMessageNotReadableException"))));
    }

    @Test
    void noteWithExactlyThreeHundredCharactersIsAccepted() throws Exception {
        String note = "가".repeat(300);

        mockMvc.perform(put("/api/pets/1/diary/2026-08-18")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson("GOOD", note)))
                .andExpect(status().isOk());
    }

    @Test
    void noteWithThreeHundredOneCharactersReturnsBadRequest() throws Exception {
        String note = "가".repeat(301);

        mockMvc.perform(put("/api/pets/1/diary/2026-08-18")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson("WATCH", note)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("note")))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("MethodArgumentNotValidException"))));
    }

    @Test
    void invalidIsoDateReturnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/pets/1/diary/2026-08-XX")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson("GOOD", "")))
                .andExpect(status().isBadRequest());
    }

    private String requestJson(String status, String note) {
        return "{\"status\":\"" + status + "\",\"note\":\"" + note + "\"}";
    }
}
