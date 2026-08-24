package com.petpulse.app.diary.controller;

import com.petpulse.app.diary.dto.HealthDiaryEntryRequest;
import com.petpulse.app.diary.dto.HealthDiaryEntryResponse;
import com.petpulse.app.diary.service.HealthDiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pets/{petId}/diary")
public class HealthDiaryController {

    private final HealthDiaryService healthDiaryService;

    @GetMapping
    public ResponseEntity<List<HealthDiaryEntryResponse>> getMonthlyEntries(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(
                healthDiaryService.getMonthlyEntries(authentication.getName(), petId, year, month));
    }

    @PutMapping("/{date}")
    public ResponseEntity<HealthDiaryEntryResponse> upsertEntry(
            Authentication authentication,
            @PathVariable Long petId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody HealthDiaryEntryRequest request) {
        return ResponseEntity.ok(
                healthDiaryService.upsertEntry(authentication.getName(), petId, date, request));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteEntry(
            Authentication authentication,
            @PathVariable Long petId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        healthDiaryService.deleteEntry(authentication.getName(), petId, date);
        return ResponseEntity.noContent().build();
    }
}
