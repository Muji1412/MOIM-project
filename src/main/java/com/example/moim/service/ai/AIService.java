package com.example.moim.service.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vertexai.gemini.VertexAiGeminiChatModel;
import org.springframework.stereotype.Service;

@Service
public class AIService {

    private final ChatClient chatClient;

    public AIService(VertexAiGeminiChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }

    // 1. 텍스트 질답
    public String getAnswer(String question) {
        try {
            return chatClient.prompt()
                    .user(question)
                    .call()
                    .content();
        } catch (Exception e) {
            System.err.println("AI 질답 에러: " + e.getMessage());
            return "죄송해요, 답변하기 어려워요. 다시 시도해주세요.";
        }
    }

    // 2. 이미지 생성
    public String generateImage(String prompt) {
        try {
            // Gemini 2.0-flash의 이미지 생성 기능 사용
            String imagePrompt = "이미지를 생성해주세요: " + prompt;

            return chatClient.prompt()
                    .user(imagePrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            System.err.println("AI 이미지 생성 에러: " + e.getMessage());
            return "이미지 생성에 실패했습니다. 다시 시도해주세요.";
        }
    }
}
