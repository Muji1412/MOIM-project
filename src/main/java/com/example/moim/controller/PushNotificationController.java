package com.example.moim.controller;


import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.entity.Users;
import com.example.moim.repository.PushSubscriptionRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.notification.PushNotificationService;
import com.example.moim.service.user.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "푸시 알림", description = "푸시 알림 관련 API입니다")
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;
    private final PushSubscriptionRepository subscriptionRepository;
    private final UsersRepository usersRepository;


    @PostMapping("/api/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    // ✅ Authentication 객체를 파라미터로 받아 현재 로그인한 사용자 정보를 가져옵니다.
    public ResponseEntity<Void> subscribe(@RequestBody PushSubscriptionDto subscriptionDto, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            // 인증되지 않은 사용자는 구독할 수 없습니다.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // ✅ Spring Security의 Authentication에서 사용자 정보를 가져옵니다.
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userNo = userDetails.getCustomUserInfoVO().getUserNo();

        // ✅ 사용자 ID로 Users 엔티티를 조회합니다.
        Users user = usersRepository.findById(userNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        System.out.println("✅ 푸시 구독 요청: " + subscriptionDto.endpoint() + " for user: " + user.getUsername());
        pushNotificationService.subscribe(subscriptionDto, user); // ✅ 서비스 호출 시 user 객체 전달
        System.out.println("✅ 푸시 구독 완료!");
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/api/send-all")
    public void sendNotificationToAll(@RequestBody NotificationRequest request) {
        System.out.println("📤 알림 발송 요청: " + request.title() + " - " + request.body());
        pushNotificationService.sendNotifications(request.title(), request.body());
        System.out.println("✅ 알림 발송 완료!");
    }
    @PostMapping("api/sendTo/{userId}")
    public void sendTo(@RequestBody NotificationRequest request, @PathVariable String userId){
        System.out.println("특정 유저한테 알람 보내기" + userId + " 에게 보냅니다.");
    }

    @PostMapping("/api/send-user/{username}")
    public void sendNotificationToUser(@PathVariable String username, @RequestBody NotificationRequest request) {
        System.out.println("📤 특정 사용자 알림 발송 요청: " + username + " - " + request.title());
        pushNotificationService.sendNotificationToUser(username, request.title(), request.body());
        System.out.println("✅ 특정 사용자 알림 발송 완료!");
    }


    @GetMapping("/api/subscriptions")
    public Map<String, Object> getSubscriptions() {
        var subscriptions = subscriptionRepository.findAll();
        return Map.of(
                "count", subscriptions.size(),
                "subscriptions", subscriptions.stream()
                        .map(sub -> Map.of(
                                "endpoint", sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())) + "...",
                                "id", sub.getId()
                        ))
                        .toList()
        );
    }



    public record NotificationRequest(String title, String body) {}
}