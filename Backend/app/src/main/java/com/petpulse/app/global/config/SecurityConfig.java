package com.petpulse.app.global.config;

import com.petpulse.app.auth.security.JwtAuthenticationFilter;
import com.petpulse.app.auth.security.RestAccessDeniedHandler;
import com.petpulse.app.auth.security.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/signup", "/api/auth/login",
                                "/api/test/**", "/api/health/**", "/actuator/health").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/ai/quick-predictions",
                                "/api/ai/food-recommendations").authenticated()
                        .requestMatchers(
                                "/api/pets/*/vitals/**",
                                "/api/pets/*/questionnaires/**",
                                "/api/pets/*/predictions/**",
                                "/api/pets/*/alerts/**",
                                "/api/pets/*/reports/**",
                                "/api/pets/*/diary/**",
                                "/api/questionnaires/**",
                                "/api/predictions/**",
                                "/api/reports/**",
                                "/api/alerts/**").authenticated()
                        .requestMatchers("/api/pets", "/api/pets/**").authenticated()
                        // Transitional policy until domain ownership checks are implemented.
                        .requestMatchers("/api/**").permitAll()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
