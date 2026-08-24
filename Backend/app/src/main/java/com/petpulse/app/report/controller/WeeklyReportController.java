package com.petpulse.app.report.controller;

import com.petpulse.app.report.dto.WeeklyReportResponse;
import com.petpulse.app.report.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @PostMapping("/pets/{petId}/reports/weekly")
    public ResponseEntity<WeeklyReportResponse> createWeeklyReport(
            Authentication authentication,
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                weeklyReportService.createWeeklyReport(authentication.getName(), petId));
    }

    @GetMapping("/pets/{petId}/reports/weekly")
    public ResponseEntity<List<WeeklyReportResponse>> getWeeklyReports(
            Authentication authentication,
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                weeklyReportService.getWeeklyReports(authentication.getName(), petId));
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<WeeklyReportResponse> getWeeklyReport(
            Authentication authentication,
            @PathVariable Long reportId) {

        return ResponseEntity.ok(
                weeklyReportService.getWeeklyReport(authentication.getName(), reportId));
    }
}
