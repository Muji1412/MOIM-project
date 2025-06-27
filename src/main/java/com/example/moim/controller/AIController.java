package com.example.moim.controller;

import com.example.moim.service.ai.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    // 1. 질답 API
    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(@RequestBody Map<String, String> request) {
        String question = request.get("question");

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "질문을 입력해주세요."));
        }

        String answer = aiService.getAnswer(question);
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    // 2. 이미지 생성 API
    @PostMapping("/generate-image")
    public ResponseEntity<Map<String, String>> generateImage(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");

        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "이미지 설명을 입력해주세요."));
        }

        String result = aiService.generateImage(prompt);
        return ResponseEntity.ok(Map.of("result", result));
    }
}
