package com.petpulse.app.pet.controller;

import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    @PostMapping
    public ResponseEntity<PetResponse> createPet(
            @Valid @RequestBody PetRequest request) {
        PetResponse response = petService.createPet(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<PetResponse>> getPets(
            @RequestParam Long userId) {
        List<PetResponse> response = petService.getPets(userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{petId}")
    public ResponseEntity<PetResponse> getPet(
            @PathVariable Long petId) {
        PetResponse response = petService.getPet(petId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{petId}")
    public ResponseEntity<PetResponse> updatePet(
            @PathVariable Long petId,
            @Valid @RequestBody PetRequest request) {
        PetResponse response = petService.updatePet(petId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(
            @PathVariable Long petId) {
        petService.deletePet(petId);

        return ResponseEntity.noContent().build();
    }
}