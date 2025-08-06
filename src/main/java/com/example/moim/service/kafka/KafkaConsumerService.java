package com.example.moim.service.kafka;

import com.example.moim.command.NotificationDto;
import com.example.moim.service.sse.SseService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    private final SseService sseService;
    private final ObjectMapper objectMapper;

    public KafkaConsumerService(SseService sseService, ObjectMapper objectMapper) {
        this.sseService = sseService;
        this.objectMapper = objectMapper;
    }

    /**
     * 'notifications' 토픽을 리스닝(구독)
     * @param jsonMessage Kafka로부터 받은 JSON 문자열 메시지
     */
    @KafkaListener(topics = "notifications", groupId = "my-group")
    public void consume(String jsonMessage) {
        try {
            log.info("Received message from Kafka: {}", jsonMessage);
            // JSON 문자열을 DTO로 변환
            NotificationDto notificationDto = objectMapper.readValue(jsonMessage, NotificationDto.class);

            // SseService를 통해 클라이언트에게 알림 전송
            sseService.sendNotification(notificationDto.userId(), notificationDto.message());

        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize notification message", e);
        }
    }
}