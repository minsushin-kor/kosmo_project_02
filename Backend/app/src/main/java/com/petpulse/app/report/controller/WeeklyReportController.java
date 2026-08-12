package com.petpulse.app.report.controller;

import com.petpulse.app.report.dto.WeeklyReportResponse;
import com.petpulse.app.report.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @PostMapping("/pets/{petId}/reports/weekly")
    public ResponseEntity<WeeklyReportResponse> createWeeklyReport(
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                weeklyReportService.createWeeklyReport(petId));
    }

    @GetMapping("/pets/{petId}/reports/weekly")
    public ResponseEntity<List<WeeklyReportResponse>> getWeeklyReports(
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                weeklyReportService.getWeeklyReports(petId));
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<WeeklyReportResponse> getWeeklyReport(
            @PathVariable Long reportId) {

        return ResponseEntity.ok(
                weeklyReportService.getWeeklyReport(reportId));
    }
}