package com.petpulse.app.healthrecord.controller;

import com.petpulse.app.healthrecord.dto.HealthRecordDetailResponse;
import com.petpulse.app.healthrecord.dto.HealthRecordPageResponse;
import com.petpulse.app.healthrecord.dto.HealthRecordStatus;
import com.petpulse.app.healthrecord.service.HealthRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class HealthRecordController {

    private final HealthRecordService healthRecordService;

    @GetMapping("/api/pets/{petId}/health-records")
    public ResponseEntity<HealthRecordPageResponse> getHealthRecords(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "ALL") HealthRecordStatus status) {

        return ResponseEntity.ok(
                healthRecordService.getHealthRecords(
                        authentication.getName(),
                        petId,
                        page,
                        size,
                        status));
    }

    @GetMapping("/api/questionnaires/{questionnaireId}/health-record")
    public ResponseEntity<HealthRecordDetailResponse> getHealthRecord(
            Authentication authentication,
            @PathVariable Long questionnaireId) {

        return ResponseEntity.ok(
                healthRecordService.getHealthRecord(
                        authentication.getName(),
                        questionnaireId));
    }

    @DeleteMapping("/api/questionnaires/{questionnaireId}")
    public ResponseEntity<Void> deleteHealthRecord(
            Authentication authentication,
            @PathVariable Long questionnaireId) {

        healthRecordService.deleteHealthRecord(
                authentication.getName(),
                questionnaireId);

        return ResponseEntity.noContent().build();
    }
}
