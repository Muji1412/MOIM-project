package com.example.moim.controller;

import com.example.moim.command.NotificationDto;
import com.example.moim.service.kafka.KafkaProducerService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    private final KafkaProducerService producerService;

    public TestController(KafkaProducerService producerService) {
        this.producerService = producerService;
    }

    /**
     * Kafka로 알림을 보내는 테스트용 API
     */
    @PostMapping("/send-notification")
    public String sendNotification(@RequestBody NotificationDto notificationDto) {
        producerService.sendNotification(notificationDto);
        return "Notification has been sent to Kafka!";
    }
}
