package com.example.moim.controller;

import com.example.moim.exception.SessionNotFoundException;
import com.example.moim.service.openvidu.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class OpenViduController {

    private static final Logger logger = LoggerFactory.getLogger(OpenViduController.class);

    private final OpenViduService openViduService;

    // 생성자 주입
    public OpenViduController(OpenViduService openViduService) {
        this.openViduService = openViduService;
    }

    /**
     * 세션 생성
     */
    @PostMapping("/sessions")
    public ResponseEntity<String> createSession(@RequestBody(required = false) Map<String, Object> params) {
        try {
            String sessionId = openViduService.createSession(params);
            return ResponseEntity.ok(sessionId);
        } catch (OpenViduHttpException e) {
            logger.error("세션 생성 중 OpenVidu HTTP 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body("세션 생성 실패: " + e.getMessage());
        } catch (Exception e) {
            logger.error("세션 생성 중 예상치 못한 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("세션 생성 실패");
        }
    }

    /**
     * 지정된 세션 ID로 연결(토큰)을 생성합니다.
     */
    @PostMapping("/sessions/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable("sessionId") String sessionId,
                                                   @RequestBody(required = false) Map<String, Object> params) {
        try {
            String token = openViduService.createConnection(sessionId, params);
            return ResponseEntity.ok(token);
        } catch (SessionNotFoundException e) {
            logger.warn("연결 생성 중 세션을 찾지 못함: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (OpenViduHttpException e) {
            logger.error("연결 생성 중 OpenVidu HTTP 오류 발생 - 세션: {}, 상태코드: {}, 메시지: {}",
                    sessionId, e.getStatus(), e.getMessage());
            return ResponseEntity.status(e.getStatus()).body("연결 생성 실패: " + e.getMessage());
        } catch (OpenViduJavaClientException e) {
            logger.error("연결 생성 중 OpenVidu 클라이언트 오류 발생 - 세션: {}, 메시지: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("연결 생성 중 클라이언트 오류 발생");
        } catch (Exception e) {
            logger.error("연결 생성 중 예상치 못한 오류 발생 - 세션: {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("연결 생성 실패");
        }
    }

    /**
     * 서비스 상태를 확인하는 헬스체크 엔드포인트입니다.
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        boolean isHealthy = openViduService.isServiceHealthy();
        if (isHealthy) {
            return ResponseEntity.ok("OpenVidu 서비스 정상 작동 중");
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("OpenVidu 서비스 연결 실패");
        }
    }
}
