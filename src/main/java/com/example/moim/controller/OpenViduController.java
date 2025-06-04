package com.example.moim.controller;

import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class OpenViduController {

    private static final Logger logger = LoggerFactory.getLogger(OpenViduController.class);

    @Value("${OPENVIDU_URL}")
    private String openviduUrl;

    @Value("${OPENVIDU_SECRET}")
    private String openviduSecret;

    private OpenVidu openvidu;

    @PostConstruct
    public void init() {
        this.openvidu = new OpenVidu(openviduUrl, openviduSecret);
        logger.info("OpenVidu 클라이언트 초기화 완료 - URL: {}", openviduUrl);
    }

    @PostMapping("/sessions")
    public ResponseEntity<String> createSession(@RequestBody(required = false) Map<String, Object> params) {
        try {
            SessionProperties.Builder builder = new SessionProperties.Builder();

            // customSessionId 처리
            if (params != null && params.containsKey("customSessionId")) {
                String customSessionId = (String) params.get("customSessionId");
                builder.customSessionId(customSessionId);
                logger.info("커스텀 세션 ID로 생성 시도: {}", customSessionId);
            }

            SessionProperties properties = builder.build();
            Session session = openvidu.createSession(properties);

            logger.info("세션 생성 성공: {}", session.getSessionId());
            return ResponseEntity.ok(session.getSessionId());

        } catch (OpenViduHttpException e) {
            if (e.getStatus() == 409) {
                // 세션이 이미 존재하는 경우
                String existingSessionId = (String) params.get("customSessionId");
                logger.warn("세션이 이미 존재함: {}", existingSessionId);
                return ResponseEntity.ok(existingSessionId);
            }
            logger.error("OpenVidu HTTP 오류 - 상태코드: {}, 메시지: {}", e.getStatus(), e.getMessage());
            return ResponseEntity.status(e.getStatus())
                    .body("세션 생성 실패: " + e.getMessage());
        } catch (OpenViduJavaClientException e) {
            logger.error("OpenVidu 클라이언트 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("세션 생성 중 클라이언트 오류 발생");
        } catch (Exception e) {
            logger.error("예상치 못한 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("세션 생성 실패");
        }
    }

    @PostMapping("/sessions/{sessionId}/connections")
    public ResponseEntity<String> createConnection(
            @PathVariable("sessionId") String sessionId,
            @RequestBody(required = false) Map<String, Object> params) {

        try {
            // 세션 존재 여부 확인
            Session session = openvidu.getActiveSession(sessionId);
            if (session == null) {
                logger.warn("세션을 찾을 수 없음: {}", sessionId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("세션을 찾을 수 없습니다: " + sessionId);
            }

            // 연결 속성 설정
            ConnectionProperties properties = buildConnectionProperties(params);

            // 연결 생성
            Connection connection = session.createConnection(properties);

            logger.info("연결 생성 성공 - 세션: {}, 연결ID: {}", sessionId, connection.getConnectionId());
            return ResponseEntity.ok(connection.getToken());

        } catch (OpenViduHttpException e) {
            logger.error("OpenVidu HTTP 오류 - 세션: {}, 상태코드: {}, 메시지: {}",
                    sessionId, e.getStatus(), e.getMessage());
            return ResponseEntity.status(e.getStatus())
                    .body("연결 생성 실패: " + e.getMessage());
        } catch (OpenViduJavaClientException e) {
            logger.error("OpenVidu 클라이언트 오류 - 세션: {}, 메시지: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("연결 생성 중 클라이언트 오류 발생");
        } catch (Exception e) {
            logger.error("예상치 못한 오류 발생 - 세션: {}, 메시지: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("연결 생성 실패");
        }
    }

    /**
     * 연결 속성을 빌드하는 헬퍼 메서드
     */
    private ConnectionProperties buildConnectionProperties(Map<String, Object> params)
            throws OpenViduJavaClientException {

        if (params == null || params.isEmpty()) {
            logger.debug("기본 연결 속성 사용");
            return new ConnectionProperties.Builder().build();
        }

        logger.debug("커스텀 연결 속성 사용: {}", params);
        return ConnectionProperties.fromJson(params).build();
    }

    /**
     * 헬스체크 엔드포인트
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        try {
            // OpenVidu 서버 연결 상태 확인
            openvidu.fetch();
            return ResponseEntity.ok("OpenVidu 서비스 정상 작동 중");
        } catch (Exception e) {
            logger.error("헬스체크 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("OpenVidu 서비스 연결 실패");
        }
    }
}


//package com.example.moim.controller;
//
//import io.openvidu.java.client.*;
//import jakarta.annotation.PostConstruct;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//
//@RestController
//public class OpenViduController {
//
//    @Value("${OPENVIDU_URL}")
//    private String OPENVIDU_URL;
//
//    @Value("${OPENVIDU_SECRET}")
//    private String OPENVIDU_SECRET;
//
//    private OpenVidu openvidu;
//
//    @PostConstruct
//    public void init() {
//        this.openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
//    }
//
//
//    @PostMapping("/api/sessions")
//    public ResponseEntity<String> initializeSession(@RequestBody(required = false) Map<String, Object> params) {
//        try {
//            SessionProperties.Builder builder = new SessionProperties.Builder();
//
//            // customSessionId 처리 추가
//            if (params != null && params.containsKey("customSessionId")) {
//                String customSessionId = (String) params.get("customSessionId");
//                builder.customSessionId(customSessionId);
//                System.out.println("커스텀 세션 ID로 생성 시도: " + customSessionId);
//            }
//
//            SessionProperties properties = builder.build();
//            Session session = openvidu.createSession(properties);
//
//            return new ResponseEntity<>(session.getSessionId(), HttpStatus.OK);
//
//        } catch (OpenViduHttpException e) {
//            if (e.getStatus() == 409) {
//                // 세션이 이미 존재하는 경우 - 정상 처리
//                String existingSessionId = (String) params.get("customSessionId");
//                System.out.println("세션이 이미 존재함: " + existingSessionId);
//                return new ResponseEntity<>(existingSessionId, HttpStatus.OK);
//            }
//            System.err.println("OpenVidu HTTP 오류: " + e.getMessage());
//            return new ResponseEntity<>("세션 생성 실패: " + e.getMessage(), HttpStatus.valueOf(e.getStatus()));
//        } catch (Exception e) {
//            System.err.println("세션 생성 오류: " + e.getMessage());
//            e.printStackTrace();
//            return new ResponseEntity<>("세션 생성 실패", HttpStatus.INTERNAL_SERVER_ERROR);
//        }
//    }
//
//
//    @PostMapping("/api/sessions/{sessionId}/connections")
//    public ResponseEntity<String> createConnection(@PathVariable("sessionId") String sessionId,
//                                                   @RequestBody(required = false) Map<String, Object> params) {
//        try {
//            Session session = openvidu.getActiveSession(sessionId);
//            if (session == null) {
//                return new ResponseEntity<>("세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
//            }
//
//            ConnectionProperties properties;
//            if (params == null || params.isEmpty()) {
//                // 빈 객체나 null일 경우 기본 속성 사용
//                properties = new ConnectionProperties.Builder().build();
//            } else {
//                properties = ConnectionProperties.fromJson(params).build();
//            }
//
//            Connection connection = session.createConnection(properties);
//            return new ResponseEntity<>(connection.getToken(), HttpStatus.OK);
//        } catch (Exception e) {
//            System.err.println("토큰 생성 오류: " + e.getMessage());
//            e.printStackTrace(); // 더 자세한 에러 로그 출력
//            return new ResponseEntity<>("토큰 생성 실패", HttpStatus.INTERNAL_SERVER_ERROR);
//        }
//    }
//}
//
//
