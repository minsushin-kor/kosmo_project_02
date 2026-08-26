package com.petpulse.app.pet.controller;

import com.petpulse.app.pet.dto.PetProfileImageContent;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.service.PetProfileImageService;
import com.petpulse.app.pet.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pets/{petId}/profile-image")
public class PetProfileImageController {
    private final PetProfileImageService imageService;
    private final PetService petService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PetResponse> upload(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestPart("image") MultipartFile image) {
        imageService.save(authentication.getName(), petId, image);
        return ResponseEntity.ok(petService.getPet(authentication.getName(), petId));
    }

    @GetMapping
    public ResponseEntity<byte[]> get(@PathVariable Long petId) {
        PetProfileImageContent image = imageService.get(petId);
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(image.originalFileName() == null ? "pet-profile" : image.originalFileName(),
                        StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .contentLength(image.data().length)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(image.data());
    }

    @DeleteMapping
    public ResponseEntity<PetResponse> delete(
            Authentication authentication,
            @PathVariable Long petId) {
        imageService.delete(authentication.getName(), petId);
        return ResponseEntity.ok(petService.getPet(authentication.getName(), petId));
    }
}
