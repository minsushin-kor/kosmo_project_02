package com.petpulse.app.questionnaire.controller;

import com.petpulse.app.questionnaire.dto.QuestionnaireRequest;
import com.petpulse.app.questionnaire.dto.QuestionnaireResponse;
import com.petpulse.app.questionnaire.service.QuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    @PostMapping("/api/pets/{petId}/questionnaires")
    public ResponseEntity<QuestionnaireResponse> createQuestionnaire(
            @PathVariable Long petId,
            @RequestBody QuestionnaireRequest request) {

        QuestionnaireResponse response = questionnaireService.createQuestionnaire(petId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/api/pets/{petId}/questionnaires")
    public ResponseEntity<List<QuestionnaireResponse>> getQuestionnaires(
            @PathVariable Long petId) {

        return ResponseEntity.ok(
                questionnaireService.getQuestionnaires(petId));
    }

    @GetMapping("/api/questionnaires/{questionnaireId}")
    public ResponseEntity<QuestionnaireResponse> getQuestionnaire(
            @PathVariable Long questionnaireId) {

        return ResponseEntity.ok(
                questionnaireService.getQuestionnaire(questionnaireId));
    }
}