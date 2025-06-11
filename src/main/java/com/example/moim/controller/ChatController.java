package com.example.moim.controller;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public void saveChat(@RequestBody ChatMessage message) {
        chatService.saveChat(message);
    }

    @GetMapping("/{date}")
    public List<ChatMessage> getChatsByDate(@PathVariable String date) {
        return chatService.getChatsByDate(date);
    }
    // 전체 채팅 데이터 조회 API
    @GetMapping
    public List<ChatMessage> getAllChats() {
        return chatService.getAllChats();
    }

}
