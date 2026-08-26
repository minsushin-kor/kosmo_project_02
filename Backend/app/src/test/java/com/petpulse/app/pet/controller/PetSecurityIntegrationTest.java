package com.petpulse.app.pet.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest
class PetSecurityIntegrationTest {
    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void petsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/pets"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("AUTHENTICATION_FAILED"));
    }

    @Test
    void profileImageUploadRequiresAuthentication() throws Exception {
        mockMvc.perform(multipart("/api/pets/1/profile-image"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("AUTHENTICATION_FAILED"));
    }

    @Test
    void profileImageCanBeRenderedByAnImageElementWithoutAuthorization() throws Exception {
        mockMvc.perform(get("/api/pets/9223372036854775807/profile-image"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void lostPetPublicProfileDoesNotRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/public/lost-pets/non-existing-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void lostPetQrManagementRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/pets/1/lost-qr-profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("AUTHENTICATION_FAILED"));
    }
}
