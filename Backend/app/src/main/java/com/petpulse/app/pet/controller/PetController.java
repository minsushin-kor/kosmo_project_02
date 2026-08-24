package com.petpulse.app.pet.controller;

import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    @PostMapping
    public ResponseEntity<PetResponse> createPet(
            Authentication authentication,
            @Valid @RequestBody PetRequest request) {
        PetResponse response = petService.createPet(authentication.getName(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<PetResponse>> getPets(
            Authentication authentication) {
        List<PetResponse> response = petService.getPets(authentication.getName());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{petId}")
    public ResponseEntity<PetResponse> getPet(
            Authentication authentication,
            @PathVariable Long petId) {
        PetResponse response = petService.getPet(authentication.getName(), petId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{petId}")
    public ResponseEntity<PetResponse> updatePet(
            Authentication authentication,
            @PathVariable Long petId,
            @Valid @RequestBody PetRequest request) {
        PetResponse response = petService.updatePet(authentication.getName(), petId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(
            Authentication authentication,
            @PathVariable Long petId) {
        petService.deletePet(authentication.getName(), petId);

        return ResponseEntity.noContent().build();
    }
}
