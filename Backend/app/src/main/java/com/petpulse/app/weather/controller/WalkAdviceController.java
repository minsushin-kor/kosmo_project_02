package com.petpulse.app.weather.controller;

import com.petpulse.app.global.response.ApiResponse;
import com.petpulse.app.weather.dto.WalkAdviceResponse;
import com.petpulse.app.weather.service.WalkAdviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-advice")
public class WalkAdviceController {
    private final WalkAdviceService walkAdviceService;

    @GetMapping
    public ResponseEntity<ApiResponse<WalkAdviceResponse>> getAdvice(
            Authentication authentication,
            @RequestParam Long petId,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(ApiResponse.success(
                walkAdviceService.getAdvice(authentication.getName(), petId, location)));
    }
}
