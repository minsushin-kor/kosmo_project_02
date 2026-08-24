package com.petpulse.app.alert.controller;

import com.petpulse.app.alert.dto.HealthAlertResponse;
import com.petpulse.app.alert.service.HealthAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class HealthAlertController {

    private final HealthAlertService healthAlertService;

    @GetMapping("/pets/{petId}/alerts")
    public ResponseEntity<List<HealthAlertResponse>> getAlerts(
            Authentication authentication,
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                healthAlertService.getAlertsByPet(authentication.getName(), petId));
    }

    @PatchMapping("/alerts/{alertId}/read")
    public ResponseEntity<HealthAlertResponse> markAsRead(
            Authentication authentication,
            @PathVariable Long alertId) {

        return ResponseEntity.ok(
                healthAlertService.markAsRead(authentication.getName(), alertId));
    }

    @PatchMapping("/pets/{petId}/alerts/read-all")
    public ResponseEntity<Integer> markAllAsRead(
            Authentication authentication,
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                healthAlertService.markAllAsRead(authentication.getName(), petId));
    }
}
