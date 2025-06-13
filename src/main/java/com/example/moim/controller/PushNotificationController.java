package com.example.moim.controller;


import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.service.notification.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    @PostMapping("/api/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public void subscribe(@RequestBody PushSubscriptionDto subscriptionDto) {
        pushNotificationService.subscribe(subscriptionDto);
    }

    @PostMapping("/api/send-all")
    public void sendNotificationToAll(@RequestBody NotificationRequest request) {
        pushNotificationService.sendNotifications(request.title(), request.body());
    }

    public record NotificationRequest(String title, String body) {}
}