package com.example.moim.controller;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Controller // STOMP(WebSocket) 메시지 처리를 위한 컨트롤러임을 명시
public class ChatController {

    private final ChatService chatService;

    // 생성자 주입 방식
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // 1. 실시간 채팅 메시지 처리 (채널별)
    // 클라이언트가 /app/chat/{groupName}로 메시지를 보내면 이 메서드가 실행됨
    // @SendTo로 지정한 /topic/chat/{channel}을 구독한 모든 클라이언트에게 메시지를 실시간으로 전달
    @MessageMapping("/chat/{groupName}")
    @SendTo("/topic/chat/{groupName}")
    public ChatMessage sendMessage(@DestinationVariable String groupName, ChatMessage message) {
        // message.channel 필드에 채널 ID가 들어있어야 함
        chatService.saveChat(groupName, message.getChannel(), message);
        return message; // 브로드캐스트
    }


    // 2. 이미지 업로드 (REST 방식)
    // 클라이언트가 이미지를 업로드하면 이 메서드가 실행됨
    // MultipartFile로 이미지를 받아 GCP에 저장, 저장된 이미지 URL을 반환
    @PostMapping("/api/chat/image")
    @ResponseBody
    public String uploadImage(@RequestParam("file") MultipartFile file) {
        return chatService.uploadImageToGCS(file);
    }

    // 메시지 전송 (WebSocket)
    // 채널별 전체 메시지 조회 (REST)
    @GetMapping("/api/chat/{groupName}/{channelName}/all")
    @ResponseBody
    public List<ChatMessage> getAllChats(@PathVariable String groupName, @PathVariable String channelName) {
        return chatService.getChatsByChannel(groupName, channelName);
    }

}
