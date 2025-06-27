package com.example.moim.controller;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import com.example.moim.chatting.ChatSessionManager;
import com.example.moim.command.UserListResponse;
import com.example.moim.entity.Users;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.ai.AIService;
import com.example.moim.service.notification.PushNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.ResponseEntity; // 추가 import
import org.springframework.http.HttpStatus; // 추가 import

@Slf4j
@Controller // STOMP(WebSocket) 메시지 처리를 위한 컨트롤러임을 명시
public class ChatController {

    private final ChatService chatService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ChatSessionManager sessionManager;
    private final UsersRepository usersRepository;
    private final PushNotificationService pushNotificationService;

    // 생성자 주입 방식
    public ChatController(ChatService chatService,
                          RedisTemplate<String, Object> redisTemplate,
                          ChatSessionManager sessionManager, UsersRepository usersRepository, PushNotificationService pushNotificationService ) {
        this.chatService = chatService;
        this.redisTemplate = redisTemplate;
        this.sessionManager = sessionManager;
        this.usersRepository = usersRepository;
        this.pushNotificationService = pushNotificationService;
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

        chatService.saveChat(groupName, message.getChannel(), message);
        // 태원 추가파트 - 제미니 답변을 위해서 메세지 보낸 이후로 옮김
        // groupName 나오고, message 객체 안에
//        System.out.println("sendMessage 디버깅");
//        System.out.println(groupName);
//        System.out.println(message.toString());
        // text=@test11 @imurditto2
        // Redis에 프로필 이미지가 포함된 메시지 저장
        // 서비스 전에, 일단 메세지에 @이 포함돼있는지 확인하고 실행

        // api 호출 비동기 처리, 이렇게 비동기 처리를 해주지 않는다면 한참 걸려서 메세지가 바로 반환되지 않음.
        CompletableFuture.runAsync(() -> {

            if (message.getText().contains("@")) {
                pushNotificationService.sendMentionNotification(groupName, message);
            }else {
//                System.out.println("어싱크 안됐음");
            }
        });

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
                            SimpMessageHeaderAccessor headerAccessor) {
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
        joinMessage.setDate(new Date().toString());

        // 채팅 기록에 저장 (선택사항)
        // chatService.saveChat(groupName, channel, joinMessage);
    }

    // 6. 채널 퇴장 처리 (WebSocket)
    @MessageMapping("/chat/leave/{groupName}")
    public void leaveChannel(@DestinationVariable String groupName,
                             ChatMessage message,
                             SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String username = message.getUser();
        String channel = message.getChannel();

        // 사용자를 채널에서 제거
        sessionManager.removeUser(channel, sessionId);

        System.out.println(username + "이(가) " + channel + " 채널에서 퇴장했습니다.");
    }

}
