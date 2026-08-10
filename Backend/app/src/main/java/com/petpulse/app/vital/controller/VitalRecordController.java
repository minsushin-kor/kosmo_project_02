package com.petpulse.app.vital.controller;

import com.petpulse.app.vital.dto.VitalRecordRequest;
import com.petpulse.app.vital.dto.VitalRecordResponse;
import com.petpulse.app.vital.service.VitalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pets/{petId}/vitals")
public class VitalRecordController {

    private final VitalRecordService vitalRecordService;

    @PostMapping
    public ResponseEntity<VitalRecordResponse> createVitalRecord(
            @PathVariable Long petId,
            @Valid @RequestBody VitalRecordRequest request) {

        VitalRecordResponse response = vitalRecordService.createVitalRecord(petId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/latest")
    public ResponseEntity<VitalRecordResponse> getLatestVitalRecord(
            @PathVariable Long petId) {

        VitalRecordResponse response = vitalRecordService.getLatestVitalRecord(petId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<VitalRecordResponse>> getVitalRecords(
            @PathVariable Long petId) {

        List<VitalRecordResponse> response = vitalRecordService.getVitalRecords(petId);

        return ResponseEntity.ok(response);
    }
}