package com.example.moim.service.kafka;


import com.example.moim.command.NotificationDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);
    private static final String TOPIC = "notifications"; // Kafka 토픽 이름

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper; // DTO를 JSON 문자열로 변환하기 위함

    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 알림 메시지를 Kafka 토픽으로 전송
     * @param notificationDto 알림 DTO
     */
    public void sendNotification(NotificationDto notificationDto) {
        try {
            // DTO를 JSON 문자열로 변환
            String jsonMessage = objectMapper.writeValueAsString(notificationDto);
            // 'notifications' 토픽으로 메시지 전송
            kafkaTemplate.send(TOPIC, jsonMessage);
            log.info("Sent notification to Kafka: {}", jsonMessage);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize NotificationDto", e);
        }
    }
}