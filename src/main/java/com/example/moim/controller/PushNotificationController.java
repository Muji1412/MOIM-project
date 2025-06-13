package com.example.moim.controller;


import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.repository.PushSubscriptionRepository;
import com.example.moim.service.notification.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;
    private final PushSubscriptionRepository subscriptionRepository;

    @PostMapping("/api/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public void subscribe(@RequestBody PushSubscriptionDto subscriptionDto) {
        System.out.println("✅ 푸시 구독 요청: " + subscriptionDto.endpoint());
        pushNotificationService.subscribe(subscriptionDto);
        System.out.println("✅ 푸시 구독 완료!");
    }

    @PostMapping("/api/send-all")
    public void sendNotificationToAll(@RequestBody NotificationRequest request) {
        System.out.println("📤 알림 발송 요청: " + request.title() + " - " + request.body());
        pushNotificationService.sendNotifications(request.title(), request.body());
        System.out.println("✅ 알림 발송 완료!");
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