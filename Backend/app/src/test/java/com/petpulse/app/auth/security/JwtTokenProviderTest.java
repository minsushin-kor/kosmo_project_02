package com.petpulse.app.auth.security;

import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {
    private static final String SECRET = "01234567890123456789012345678901";

    @Test
    void tokenContainsLoginIdSubjectRoleAndExpiration() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET, 3600);
        User user = new User("guardian", "$2a$encoded", "user@example.com",
                "보호자", null, UserRole.USER);

        var claims = provider.parseClaims(provider.createToken(user));

        assertEquals("guardian", claims.getSubject());
        assertEquals("USER", claims.get("role", String.class));
        assertNotNull(claims.getIssuedAt());
        assertTrue(claims.getExpiration().after(claims.getIssuedAt()));
    }

    @Test
    void secretShorterThanThirtyTwoBytesIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtTokenProvider("too-short", 3600));
    }
}
