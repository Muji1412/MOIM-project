package com.example.moim.controller;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.command.DirectMessageDTO;
import com.example.moim.command.DirectMessageRoomDTO;
import com.example.moim.entity.DirectMessage;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.dm.DirectMessageService;
import com.example.moim.service.user.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DirectMessageController {

    private final DirectMessageService dmService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final UsersRepository usersRepository;

    // DM 채팅방 생성 또는 조회
    @PostMapping("/api/dm/rooms")
    public ResponseEntity<DirectMessageRoomDTO> createOrGetRoom(Authentication authentication, @RequestBody Map<String, String> payload) {
        String currentUserNick = authToNick(authentication);
        String recipientUserNick = payload.get("recipientNick");
        DirectMessageRoomDTO room = dmService.createOrGetRoom(currentUserNick, recipientUserNick);
        return ResponseEntity.ok(room);
    }

    // 사용자의 모든 DM 채팅방 목록 조회
    @GetMapping("/api/dm/rooms")
    public ResponseEntity<List<DirectMessageRoomDTO>> getUserRooms(Authentication authentication) {
        String currentUserNick = authToNick(authentication);
        List<DirectMessageRoomDTO> rooms = dmService.getRoomsForUser(currentUserNick);
        return ResponseEntity.ok(rooms);
    }

    // 특정 DM 채팅방의 메시지 목록 조회
    @GetMapping("/api/dm/rooms/{roomId}/messages")
    public ResponseEntity<List<DirectMessageDTO>> getRoomMessages(@PathVariable Long roomId) {
        List<DirectMessageDTO> messages = dmService.getMessagesForRoom(roomId);
        return ResponseEntity.ok(messages);
    }

    // WebSocket 메시지 핸들러
    @MessageMapping("/dm")
    public void sendMessage(ChatMessage message) {
        // 메시지 저장
        DirectMessage savedMessage = dmService.saveMessage(message);
        // 해당 DM방을 구독하고 있는 클라이언트에게 메시지 전송
        messagingTemplate.convertAndSend("/sub/dm/room/" + message.getChannel(), message);
    }

    // 일시방편용 메서드
    private String authToNick(Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUsername();
        return usersRepository.findUserNickByUsername(userId);
    }
}
