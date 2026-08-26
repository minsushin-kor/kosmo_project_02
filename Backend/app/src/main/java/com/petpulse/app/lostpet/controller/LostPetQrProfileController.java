package com.petpulse.app.lostpet.controller;

import com.petpulse.app.lostpet.dto.LostPetQrProfileResponse;
import com.petpulse.app.lostpet.dto.PublicLostPetProfileResponse;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrActiveRequest;
import com.petpulse.app.lostpet.service.LostPetQrProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class LostPetQrProfileController {
    private final LostPetQrProfileService service;

    @GetMapping("/pets/{petId}/lost-qr-profile")
    public ResponseEntity<LostPetQrProfileResponse> getProfile(
            Authentication authentication,
            @PathVariable Long petId) {
        return ResponseEntity.ok(service.getProfile(authentication.getName(), petId));
    }

    @PostMapping("/pets/{petId}/lost-qr-profile")
    public ResponseEntity<LostPetQrProfileResponse> createProfile(
            Authentication authentication,
            @PathVariable Long petId) {
        return ResponseEntity.ok(service.createProfile(authentication.getName(), petId));
    }

    @PatchMapping("/pets/{petId}/lost-qr-profile/active")
    public ResponseEntity<LostPetQrProfileResponse> updateActive(
            Authentication authentication,
            @PathVariable Long petId,
            @Valid @RequestBody UpdateLostPetQrActiveRequest request) {
        return ResponseEntity.ok(service.updateActive(
                authentication.getName(), petId, request.active()));
    }

    @PostMapping("/pets/{petId}/lost-qr-profile/rotate-token")
    public ResponseEntity<LostPetQrProfileResponse> rotateToken(
            Authentication authentication,
            @PathVariable Long petId) {
        return ResponseEntity.ok(service.rotateToken(authentication.getName(), petId));
    }

    @GetMapping("/public/lost-pets/{publicToken}")
    public ResponseEntity<PublicLostPetProfileResponse> getPublicProfile(
            @PathVariable String publicToken) {
        return ResponseEntity.ok(service.getPublicProfile(publicToken));
    }
}

