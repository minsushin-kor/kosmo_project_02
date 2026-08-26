package com.petpulse.app.lostpet.controller;

import com.petpulse.app.lostpet.dto.CreateLostPetQrProfileRequest;
import com.petpulse.app.lostpet.dto.LostPetQrProfileResponse;
import com.petpulse.app.lostpet.dto.PublicLostPetProfileResponse;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrActiveRequest;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrVisibilityRequest;
import com.petpulse.app.lostpet.service.LostPetQrProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
            @PathVariable Long petId,
            @Valid @RequestBody CreateLostPetQrProfileRequest request) {
        return ResponseEntity.ok(service.createProfile(authentication.getName(), petId, request));
    }

    @PatchMapping("/pets/{petId}/lost-qr-profile/visibility")
    public ResponseEntity<LostPetQrProfileResponse> updateVisibility(
            Authentication authentication,
            @PathVariable Long petId,
            @Valid @RequestBody UpdateLostPetQrVisibilityRequest request) {
        return ResponseEntity.ok(service.updateVisibility(
                authentication.getName(), petId, request));
    }

    @PatchMapping("/pets/{petId}/lost-qr-profile/active")
    public ResponseEntity<LostPetQrProfileResponse> updateActive(
            Authentication authentication,
            @PathVariable Long petId,
            @Valid @RequestBody UpdateLostPetQrActiveRequest request) {
        return ResponseEntity.ok(service.updateActive(
                authentication.getName(), petId, request.active()));
    }

    @DeleteMapping("/pets/{petId}/lost-qr-profile")
    public ResponseEntity<Void> deleteProfile(
            Authentication authentication,
            @PathVariable Long petId) {
        service.deleteProfile(authentication.getName(), petId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/lost-pets/{publicToken}")
    public ResponseEntity<PublicLostPetProfileResponse> getPublicProfile(
            @PathVariable String publicToken) {
        return ResponseEntity.ok(service.getPublicProfile(publicToken));
    }
}
