package com.example.moim.controller;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import com.example.moim.chatting.ChatSessionManager;
import com.example.moim.command.UserListResponse;
import com.example.moim.entity.Users;
import com.example.moim.repository.UsersRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.http.ResponseEntity; // 추가 import
import org.springframework.http.HttpStatus; // 추가 import

@Controller // STOMP(WebSocket) 메시지 처리를 위한 컨트롤러임을 명시
public class ChatController {

    private final ChatService chatService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ChatSessionManager sessionManager;
    private final UsersRepository usersRepository;

    // 생성자 주입 방식
    public ChatController(ChatService chatService,
                          RedisTemplate<String, Object> redisTemplate,
                          ChatSessionManager sessionManager, UsersRepository usersRepository) {
        this.chatService = chatService;
        this.redisTemplate = redisTemplate;
        this.sessionManager = sessionManager;
        this.usersRepository = usersRepository;
    }

    // 1. 실시간 채팅 메시지 저장 (채널별)
    // 클라이언트가 /app/chat/{groupName}로 메시지를 보내면 이 메서드가 실행됨
    // @SendTo로 지정한 /topic/chat/{channel}을 구독한 모든 클라이언트에게 메시지를 실시간으로 전달
    @MessageMapping("/chat/{groupName}")
    @SendTo("/topic/chat/{groupName}")
    public ChatMessage sendMessage(@DestinationVariable String groupName, ChatMessage message) {
        // message.channel 필드에 채널 ID가 들어있어야 함
        // 🔥 발신자의 프로필 이미지 조회
        Users sender = usersRepository.findByUserNick(message.getUser())
                .orElse(null);

        if (sender != null && sender.getUserImg() != null) {
            message.setUserImg(sender.getUserImg());  // GCP URL 설정
        }

        // Redis에 프로필 이미지가 포함된 메시지 저장
        chatService.saveChat(groupName, message.getChannel(), message);

        return message; // 실시간 브로드캐스트 (프로필 이미지 포함)
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

        String key = "chat:" + groupName + ":" + channelName;
        System.out.println("조회 키: " + key);

        List<Object> result = redisTemplate.opsForList().range(key, 0, -1);
        System.out.println("조회 결과: " + result);

        return chatService.getChatsByChannel(groupName, channelName);
    }

    // 4. 채널 사용자 목록 조회 (REST)
    @GetMapping("/api/chat/users/{channelName}")
    @ResponseBody
    public ResponseEntity<UserListResponse> getChannelUsers(@PathVariable String channelName) {
        try {
            List<String> users = sessionManager.getChannelUsers(channelName);

            UserListResponse response = new UserListResponse();
            response.setChannelName(channelName);
            response.setUsers(users);
            response.setUserCount(users.size());
            response.setTimestamp(System.currentTimeMillis());

            System.out.println("채널 " + channelName + " 사용자 목록 조회: " + users);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("사용자 목록 조회 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UserListResponse());
        }
    }

    // 5. 채널 입장 처리 (WebSocket)
    @MessageMapping("/chat/join/{groupName}")
    public void joinChannel(@DestinationVariable String groupName,
                            ChatMessage message,
                            org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String username = message.getUser();
        String channel = message.getChannel();

        // 사용자를 채널에 추가
        sessionManager.addUser(channel, sessionId, username);

        System.out.println(username + "이(가) " + channel + " 채널에 입장했습니다. (세션: " + sessionId + ")");

        // 입장 메시지 생성 (선택사항)
        ChatMessage joinMessage = new ChatMessage();
        joinMessage.setUser("System");
        joinMessage.setText(username + "님이 채팅방에 입장했습니다.");
        joinMessage.setChannel(channel);
        joinMessage.setDate(new java.util.Date().toString());

        // 채팅 기록에 저장 (선택사항)
        // chatService.saveChat(groupName, channel, joinMessage);
    }

    // 6. 채널 퇴장 처리 (WebSocket)
    @MessageMapping("/chat/leave/{groupName}")
    public void leaveChannel(@DestinationVariable String groupName,
                             ChatMessage message,
                             org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String username = message.getUser();
        String channel = message.getChannel();

        // 사용자를 채널에서 제거
        sessionManager.removeUser(channel, sessionId);

        System.out.println(username + "이(가) " + channel + " 채널에서 퇴장했습니다.");
    }

}
