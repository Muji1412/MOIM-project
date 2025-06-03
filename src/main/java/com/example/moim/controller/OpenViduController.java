package com.example.moim.controller;

import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class OpenViduController {

    @Value("${OPENVIDU_URL}")
    private String OPENVIDU_URL;

    @Value("${OPENVIDU_SECRET}")
    private String OPENVIDU_SECRET;

    private OpenVidu openvidu;

    @PostConstruct
    public void init() {
        this.openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
    }


    // 세션 생성 api
    @PostMapping("/api/sessions")
    public ResponseEntity<String> initializeSession(@RequestBody(required = false) Map<String, Object> params) {
        try {
            SessionProperties properties;
            if (params == null || params.isEmpty()) {
                // 빈 객체나 null일 경우 기본 속성 사용
                properties = new SessionProperties.Builder().build();
            } else {
                properties = SessionProperties.fromJson(params).build();
            }

            Session session = openvidu.createSession(properties);
            return new ResponseEntity<>(session.getSessionId(), HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("세션 생성 오류: " + e.getMessage());
            e.printStackTrace(); // 더 자세한 에러 로그 출력
            return new ResponseEntity<>("세션 생성 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/api/sessions/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable("sessionId") String sessionId,
                                                   @RequestBody(required = false) Map<String, Object> params) {
        try {
            Session session = openvidu.getActiveSession(sessionId);
            if (session == null) {
                return new ResponseEntity<>("세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
            }

            ConnectionProperties properties;
            if (params == null || params.isEmpty()) {
                // 빈 객체나 null일 경우 기본 속성 사용
                properties = new ConnectionProperties.Builder().build();
            } else {
                properties = ConnectionProperties.fromJson(params).build();
            }

            Connection connection = session.createConnection(properties);
            return new ResponseEntity<>(connection.getToken(), HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("토큰 생성 오류: " + e.getMessage());
            e.printStackTrace(); // 더 자세한 에러 로그 출력
            return new ResponseEntity<>("토큰 생성 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


