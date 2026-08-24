package com.petpulse.app.pet.controller;

import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.service.PetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PetControllerTest {
    private PetService petService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        petService = mock(PetService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new PetController(petService)).build();
    }

    @Test
    void requestBodyUserIdCannotChangeOwner() throws Exception {
        mockMvc.perform(post("/api/pets")
                        .principal(new UsernamePasswordAuthenticationToken("guardian", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId":999,
                                  "petName":"초코",
                                  "species":"DOG",
                                  "breed":"푸들",
                                  "birthDate":"2023-01-01",
                                  "gender":"MALE",
                                  "weight":5.2,
                                  "neutered":true,
                                  "medicalHistory":"",
                                  "profileImageUrl":null
                                }
                                """))
                .andExpect(status().isCreated());

        verify(petService).createPet(org.mockito.ArgumentMatchers.eq("guardian"), any(PetRequest.class));
    }
}
