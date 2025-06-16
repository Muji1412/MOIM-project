package com.example.moim.controller;

import com.example.moim.service.notification.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    // 오토와이어드 안쓰고 RequiredArgsConstructor 형식으로 생성자 주입
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushNotificationService;

    // 한명 언급하거나 한명한테 알림 보내기
    public void sendNotificationToUser(String userId, String message) {
        messagingTemplate.convertAndSend("/topic/notifications/user/" + userId, message);
    }

    // 그룹 내 멤버 전체에게 보내기, erd의 groupNo = groupId로써 사용
    public void sendNotificationToGroup(String groupId, String message) {
        messagingTemplate.convertAndSend("/topic/notifications/group/" + groupId, message);
    }

    // 특정 그룹/역할의 사용자들에게 알림 - 나중에 구현
    public void sendNotificationToRole(String groupId, String roleId, String message) {
        messagingTemplate.convertAndSend("/topic/notifications/server/" + groupId + "/role/" + roleId, message);
    }

    @PostMapping("/api/test-notification")
    public ResponseEntity<String> sendTestNotification(@RequestParam String userId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("id", System.currentTimeMillis());
        notification.put("title", "서버 테스트 알림");
        notification.put("message", "백엔드에서 보낸 테스트 알림입니다!");

        // 전체 알림
        messagingTemplate.convertAndSend("/topic/all", notification);

        // 개인 알림
        messagingTemplate.convertAndSendToUser(userId, "/queue/notify", notification);

        return ResponseEntity.ok("알림 전송 완료");
    }
}
