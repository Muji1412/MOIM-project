package com.example.moim.controller;

import com.example.moim.dto.WhiteboardMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class WhiteboardController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 서버별 연결 관리 (연결ID -> 사용자명)
    private static final ConcurrentHashMap<String, ConcurrentHashMap<String, String>> serverConnections = new ConcurrentHashMap<>();

    // 서버별 최신 화이트보드 상태 저장
    private static final ConcurrentHashMap<String, String> serverWhiteboardState = new ConcurrentHashMap<>();

    @MessageMapping("/whiteboard/{serverId}")
    public void handleWhiteboardMessage(@DestinationVariable String serverId, WhiteboardMessage message) {
        System.out.println("서버 " + serverId + " 메시지: " + message.getType() + " from " + message.getUserName());

        try {
            switch (message.getType()) {
                case "user-join":
                    // 연결 추가
                    addConnection(serverId, message.getConnectionId(), message.getUserName());
                    sendUserCount(serverId);
                    break;

                case "user-leave":
                    // 연결 제거
                    removeConnection(serverId, message.getConnectionId());
                    sendUserCount(serverId);
                    break;

                case "drawing-update":
                    // 마우스를 뗄 때 받은 완성된 그림
                    System.out.println("그림 업데이트 - 크기: " + (message.getData() != null ? message.getData().length() : 0));

                    // 서버에 최신 상태 저장
                    if (message.getData() != null && !message.getData().isEmpty()) {
                        serverWhiteboardState.put(serverId, message.getData());
                        System.out.println("서버 " + serverId + " 상태 저장 완료");
                    }

                    // 모든 클라이언트에게 전송
                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
                    break;

                default:
                    // 기타 메시지는 그대로 전달
                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
                    break;
            }

        } catch (Exception e) {
            System.err.println("메시지 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void addConnection(String serverId, String connectionId, String userName) {
        if (serverId == null || connectionId == null) {
            System.err.println("serverId 또는 connectionId가 null입니다.");
            return;
        }

        // userName이 null인 경우 기본값 설정
        if (userName == null) {
            userName = "익명사용자_" + connectionId.substring(0, 6);
        }

        serverConnections.computeIfAbsent(serverId, k -> new ConcurrentHashMap<>())
                .put(connectionId, userName);

        System.out.println("연결 추가 - 서버: " + serverId + ", 사용자: " + userName);
    }

    private void removeConnection(String serverId, String connectionId) {
        ConcurrentHashMap<String, String> connections = serverConnections.get(serverId);
        if (connections != null) {
            String userName = connections.remove(connectionId);
            System.out.println("연결 제거 - 서버: " + serverId + ", 사용자: " + userName);

            // 서버에 연결이 없으면 정리
            if (connections.isEmpty()) {
                serverConnections.remove(serverId);
                serverWhiteboardState.remove(serverId);
                System.out.println("빈 서버 " + serverId + " 정리 완료");
            }
        }
    }

    private void sendUserCount(String serverId) {
        ConcurrentHashMap<String, String> connections = serverConnections.get(serverId);
        int userCount = connections != null ? connections.size() : 0;

        WhiteboardMessage countMessage = new WhiteboardMessage();
        countMessage.setType("user-count");
        countMessage.setGroupId(serverId);
        countMessage.setData(String.valueOf(userCount));
        countMessage.setConnectionId("server-count");

        messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, countMessage);
        System.out.println("서버 " + serverId + " 접속자 수: " + userCount + "명");
    }
}
