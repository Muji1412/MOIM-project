package com.example.moim.service.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);
    // 1. 모든 Emitters를 관리하는 ConcurrentHashMap
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * 2. 사용자가 SSE 구독을 요청할 때 호출되는 메소드
     * @param userId 사용자 ID
     * @return SseEmitter 객체
     */
    public SseEmitter subscribe(Long userId) {
        // 2-1. SseEmitter 객체 생성 (유효 시간: 10분)
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);

        // 2-2. 사용자 ID와 Emitter를 맵에 저장
        emitters.put(userId, emitter);
        log.info("New sse emitter subscribed: userId={}", userId);

        // 2-3. Emitter가 완료되거나 타임아웃될 때 맵에서 제거
        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("SseEmitter completed: userId={}", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.info("SseEmitter timed out: userId={}", userId);
        });
        emitter.onError(e -> {
            emitters.remove(userId);
            log.error("SseEmitter error for userId={}: {}", userId, e.getMessage());
        });


        // 2-4. 연결이 수립되면 더미 데이터 전송 (연결 확인용)
        try {
            emitter.send(SseEmitter.event()
                    .name("connect") // 이벤트 이름
                    .data("SSE connection successful. userId=" + userId));
        } catch (IOException e) {
            log.error("Failed to send initial connection message to userId={}: {}", userId, e.getMessage());
        }

        return emitter;
    }

    /**
     * 3. 특정 사용자에게 알림을 보내는 메소드
     * @param userId 사용자 ID
     * @param message 알림 메시지
     */
    public void sendNotification(Long userId, String message) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                // 3-1. 'notification'이라는 이름의 이벤트로 데이터 전송
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(message));
                log.info("Sent notification to userId={}: {}", userId, message);
            } catch (IOException e) {
                // 3-2. 에러 발생 시 Emitter 제거
                emitters.remove(userId);
                log.error("Failed to send notification to userId={}, error: {}", userId, e.getMessage());
            }
        } else {
            log.warn("No SseEmitter found for userId={}. Notification might be lost.", userId);
        }
    }
}