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
                .andExpect(status().isBadRequest());
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
                .andExpect(status().isBadRequest());
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
