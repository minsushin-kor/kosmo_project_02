package com.petpulse.app.auth.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

class SecurityErrorHandlerTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void authenticationFailureUsesCommonApiResponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        new RestAuthenticationEntryPoint(objectMapper).commence(
                new MockHttpServletRequest(), response, new BadCredentialsException("bad"));

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"success\":false"));
        assertTrue(response.getContentAsString().contains("\"error\":\"AUTHENTICATION_FAILED\""));
        assertFalse(response.getContentAsString().contains("trace"));
    }

    @Test
    void accessDeniedUsesCommonApiResponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        new RestAccessDeniedHandler(objectMapper).handle(
                new MockHttpServletRequest(), response, new AccessDeniedException("denied"));

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"success\":false"));
        assertTrue(response.getContentAsString().contains("\"error\":\"ACCESS_DENIED\""));
        assertFalse(response.getContentAsString().contains("denied"));
    }
}
