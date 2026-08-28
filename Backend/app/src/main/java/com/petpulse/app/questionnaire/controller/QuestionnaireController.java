package com.petpulse.app.questionnaire.controller;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.questionnaire.dto.QuestionnaireRequest;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;
import com.petpulse.app.questionnaire.service.QuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    @PostMapping("/api/pets/{petId}/questionnaires")
    public ResponseEntity<QuestionnaireResponse> createQuestionnaire(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestBody QuestionnaireRequest request) {

        QuestionnaireResponse response = questionnaireService.createQuestionnaire(authentication.getName(), petId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/api/pets/{petId}/questionnaires")
    public ResponseEntity<List<QuestionnaireResponse>> getQuestionnaires(
            Authentication authentication,
            @PathVariable Long petId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        if (year == null && month == null) {
            return ResponseEntity.ok(
                    questionnaireService.getQuestionnaires(authentication.getName(), petId));
        }

        if (year == null || month == null) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "year와 month는 함께 입력해야 합니다.");
        }

        return ResponseEntity.ok(
                questionnaireService.getMonthlyQuestionnaires(
                        authentication.getName(),
                        petId,
                        year,
                        month));
    }

    @GetMapping("/api/questionnaires/{questionnaireId}")
    public ResponseEntity<QuestionnaireResponse> getQuestionnaire(
            Authentication authentication,
            @PathVariable Long questionnaireId) {

        return ResponseEntity.ok(
                questionnaireService.getQuestionnaire(authentication.getName(), questionnaireId));
    }
}
