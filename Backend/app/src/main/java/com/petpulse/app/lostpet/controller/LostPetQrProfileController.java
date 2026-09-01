package com.petpulse.app.lostpet.controller;

import com.petpulse.app.lostpet.dto.CreateLostPetQrProfileRequest;
import com.petpulse.app.lostpet.dto.LostPetQrProfileResponse;
import com.petpulse.app.lostpet.dto.LostPetQrPhotoContent;
import com.petpulse.app.lostpet.dto.PublicLostPetProfileResponse;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrActiveRequest;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrVisibilityRequest;
import com.petpulse.app.lostpet.service.LostPetQrProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

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

    @PostMapping(
            value = "/pets/{petId}/lost-qr-profile/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LostPetQrProfileResponse> uploadPhoto(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestPart("image") MultipartFile image) {
        return ResponseEntity.ok(service.savePhoto(authentication.getName(), petId, image));
    }

    @DeleteMapping("/pets/{petId}/lost-qr-profile/photo")
    public ResponseEntity<LostPetQrProfileResponse> deletePhoto(
            Authentication authentication,
            @PathVariable Long petId) {
        return ResponseEntity.ok(service.deletePhoto(authentication.getName(), petId));
    }

    @GetMapping("/pets/{petId}/lost-qr-profile/photo")
    public ResponseEntity<byte[]> getOwnedPhoto(
            Authentication authentication,
            @PathVariable Long petId) {
        return imageResponse(service.getOwnedPhoto(authentication.getName(), petId));
    }

    @GetMapping("/public/lost-pets/{publicToken}")
    public ResponseEntity<PublicLostPetProfileResponse> getPublicProfile(
            @PathVariable String publicToken) {
        return ResponseEntity.ok(service.getPublicProfile(publicToken));
    }

    @GetMapping("/public/lost-pets/{publicToken}/photo")
    public ResponseEntity<byte[]> getPublicPhoto(@PathVariable String publicToken) {
        return imageResponse(service.getPublicPhoto(publicToken));
    }

    private ResponseEntity<byte[]> imageResponse(LostPetQrPhotoContent photo) {
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(photo.originalFileName() == null ? "lost-pet" : photo.originalFileName(),
                        StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .contentLength(photo.data().length)
                .cacheControl(CacheControl.noCache())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(photo.data());
    }
}
