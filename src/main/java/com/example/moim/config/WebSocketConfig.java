package com.example.moim.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration // 설정세팅 어노테이션
@EnableWebSocketMessageBroker  // 웹소켓이랑 메시지 브로커 기능 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // 1. 엔드포인트로 접속
    
    
    // TODO 개발환경용이므로 위험, 나중에 아래걸로 바꿔야함
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // 여기로 웹소켓 연결
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
//    @Override
//    public void registerStompEndpoints(StompEndpointRegistry registry) {
//        registry.addEndpoint("/ws")
//                .setAllowedOriginPatterns(  // setAllowedOrigins 대신 setAllowedOriginPatterns 사용
//                        "http://localhost:3000",     // React 개발 서버
//                        "http://localhost:8081",     // 다른 포트
//                        "http://172.30.1.68:8081",   // IP 접속
//                        "https://moim.o-r.kr",       // 프로덕션 도메인
//                        "http://localhost:8089"      // 슬래시 제거
//                )
//                .withSockJS(); // 연결 엔드포인트
//    }

    // 2. 구독 - ex) topic/notifications 같은 특정 주소 구독, 대기하면서 이곳을 감시
    // 3. 서버가 해당 토픽으로 메세지를 보내면, 구독중인 모든 클라이언트들이 메세지를 받는 구조
    // 4. 이후 리액트가 onMessage 같은 핸들러로 메세지를 처리해줌
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // ⭐️ 메시지 브로커 설정 개선 ⭐️
        config.enableSimpleBroker("/sub", "/topic", "/user") // /user 추가
                .setTaskScheduler(null); // 기본 스케줄러 사용

        config.setApplicationDestinationPrefixes("/pub");

        // ⭐️ 사용자별 목적지 prefix 설정 ⭐️
        config.setUserDestinationPrefix("/user");
    }




}
