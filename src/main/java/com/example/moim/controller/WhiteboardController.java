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
                    // 기존 연결이 있으면 먼저 제거 (중복 연결 방지)
                    removeExistingUserConnections(serverId, message.getUserName());

                    // 새 연결 추가
                    addConnection(serverId, message.getConnectionId(), message.getUserName());
                    sendUserCount(serverId);
                    break;

                case "user-leave":
                    // 연결 제거 (connectionId와 userName 둘 다 확인)
                    removeConnectionByUser(serverId, message.getConnectionId(), message.getUserName());
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

    // 중복 연결 방지를 위한 기존 사용자 연결 제거
    private void removeExistingUserConnections(String serverId, String userName) {
        if (userName == null) return;

        ConcurrentHashMap<String, String> connections = serverConnections.get(serverId);
        if (connections != null) {
            // 같은 사용자명의 모든 기존 연결 제거
            connections.entrySet().removeIf(entry -> userName.equals(entry.getValue()));
            System.out.println("기존 연결 정리 완료 - 서버: " + serverId + ", 사용자: " + userName);
        }
    }

    private void addConnection(String serverId, String connectionId, String userName) {
        if (serverId == null || connectionId == null) {
            System.err.println("serverId 또는 connectionId가 null입니다.");
            return;
        }

        if (userName == null) {
            userName = "익명사용자_" + connectionId.substring(0, 6);
        }

        // 연결 추가
        ConcurrentHashMap<String, String> connections = serverConnections.computeIfAbsent(serverId, k -> new ConcurrentHashMap<>());
        connections.put(connectionId, userName);

        System.out.println("연결 추가 - 서버: " + serverId + ", 사용자: " + userName);
    }

    // 개선된 연결 제거 메서드
    private void removeConnectionByUser(String serverId, String connectionId, String userName) {
        ConcurrentHashMap<String, String> connections = serverConnections.get(serverId);
        if (connections != null) {
            boolean removed = false;

            // connectionId로 먼저 시도
            if (connectionId != null) {
                String removedUser = connections.remove(connectionId);
                if (removedUser != null) {
                    System.out.println("연결 제거 (connectionId) - 서버: " + serverId + ", 사용자: " + removedUser);
                    removed = true;
                }
            }

            // userName으로도 제거 (중복 연결 방지)
            if (userName != null) {
                boolean userRemoved = connections.entrySet().removeIf(entry -> userName.equals(entry.getValue()));
                if (userRemoved && !removed) {
                    System.out.println("연결 제거 (userName) - 서버: " + serverId + ", 사용자: " + userName);
                    removed = true;
                }
            }

            if (!removed) {
                System.out.println("제거할 연결을 찾지 못함 - 서버: " + serverId + ", connectionId: " + connectionId + ", userName: " + userName);
            }

            // 서버에 연결이 없으면 정리
            if (connections.isEmpty()) {
                serverConnections.remove(serverId);
                serverWhiteboardState.remove(serverId);
                System.out.println("빈 서버 " + serverId + " 정리 완료");
            }
        }
    }

    // sendUserCount 메서드 수정 (connectionId 파라미터 제거)
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
