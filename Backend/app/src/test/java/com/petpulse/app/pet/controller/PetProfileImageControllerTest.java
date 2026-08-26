package com.petpulse.app.pet.controller;

import com.petpulse.app.pet.dto.PetProfileImageContent;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.service.PetProfileImageService;
import com.petpulse.app.pet.service.PetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PetProfileImageControllerTest {
    private PetProfileImageService imageService;
    private PetService petService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        imageService = mock(PetProfileImageService.class);
        petService = mock(PetService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PetProfileImageController(imageService, petService))
                .build();
    }

    @Test
    void ownerCanUploadMultipartImage() throws Exception {
        byte[] png = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile image = new MockMultipartFile(
                "image", "choco.png", "image/png", png);
        when(petService.getPet("guardian", 10L)).thenReturn(petResponse());

        mockMvc.perform(multipart("/api/pets/10/profile-image")
                        .file(image)
                        .principal(new UsernamePasswordAuthenticationToken("guardian", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.petId").value(10))
                .andExpect(jsonPath("$.profileImageUrl")
                        .value("/api/pets/10/profile-image?v=1"));

        verify(imageService).save("guardian", 10L, image);
    }

    @Test
    void imageCanBeRenderedWithItsStoredContentType() throws Exception {
        byte[] png = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        when(imageService.get(10L)).thenReturn(
                new PetProfileImageContent(png, "image/png", "choco.png", 1L));

        mockMvc.perform(get("/api/pets/10/profile-image"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(png))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age")));
    }

    private PetResponse petResponse() {
        return new PetResponse(10L, 1L, "초코", PetSpecies.DOG, "푸들",
                LocalDate.of(2023, 1, 1), PetGender.MALE, BigDecimal.valueOf(5.2),
                true, "", "/api/pets/10/profile-image?v=1", LocalDateTime.now());
    }
}
