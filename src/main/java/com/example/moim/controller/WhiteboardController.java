package com.example.moim.controller;

import com.example.moim.dto.WhiteboardMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;

@Controller
public class WhiteboardController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 서버별 사용자 관리 (userId 기준 - 중복 방지)
    private static final ConcurrentHashMap<String, Set<String>> serverUsers = new ConcurrentHashMap<>();

    // 서버별 연결 관리 (connectionId 기준 - 모든 탭/연결 추적)
    private static final ConcurrentHashMap<String, Set<String>> serverConnections = new ConcurrentHashMap<>();

    // 연결 ID와 사용자 ID 매핑
    private static final ConcurrentHashMap<String, String> connectionToUser = new ConcurrentHashMap<>();

    // 서버별 화이트보드 상태 저장
    private static final ConcurrentHashMap<String, String> serverWhiteboardState = new ConcurrentHashMap<>();

    // 서버별 assets 상태 저장
    private static final ConcurrentHashMap<String, String> serverWhiteboardAssets = new ConcurrentHashMap<>();

    @MessageMapping("/whiteboard/{serverId}")
    public void handleWhiteboardMessage(@DestinationVariable String serverId, WhiteboardMessage message) {
        System.out.println("=== 서버 " + serverId + " 화이트보드 메시지 수신 ===");
        System.out.println("타입: " + message.getType());
        System.out.println("사용자: " + message.getUserName());
        System.out.println("연결 ID: " + message.getConnectionId());

        message.setGroupId(serverId);

        try {
            switch (message.getType()) {
                case "connection-test":
                    WhiteboardMessage echoMessage = new WhiteboardMessage();
                    echoMessage.setType("echo-test");
                    echoMessage.setGroupId(serverId);
                    echoMessage.setData("서버에서 에코: " + message.getUserName());
                    echoMessage.setConnectionId("server-echo");

                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, echoMessage);
                    System.out.println(">>> 에코 메시지 전송 완료");
                    break;

                case "user-join":
                    System.out.println(">>> 연결이 서버 " + serverId + " 화이트보드에 입장");

                    addConnectionToServer(serverId, message.getConnectionId(), message.getUserId());
                    addUserToServer(serverId, message.getUserId());

                    // 상태 복원을 위해 약간의 지연 후 전송
                    new Thread(() -> {
                        try {
                            Thread.sleep(500); // 클라이언트 초기화 대기
                            sendCurrentWhiteboardState(serverId, message.getConnectionId());
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }).start();

                    sendUserCount(serverId);
                    break;

                case "user-leave":
                    System.out.println(">>> 연결이 서버 " + serverId + " 화이트보드에서 퇴장");

                    removeConnectionFromServer(serverId, message.getConnectionId());

                    if (!hasOtherConnections(serverId, message.getUserId())) {
                        removeUserFromServer(serverId, message.getUserId());
                    }

                    sendUserCount(serverId);
                    break;

                case "change":
                    System.out.println(">>> 서버 " + serverId + " 화이트보드 변경사항 처리");
                    System.out.println(">>> 연결 ID: " + message.getConnectionId() + "에서 변경");
                    System.out.println(">>> 데이터 크기: " + (message.getData() != null ? message.getData().length() : 0));

                    // assets 정보 확인
                    if (message.getAssets() != null && !message.getAssets().isEmpty()) {
                        System.out.println(">>> Assets 포함: " + message.getAssets().length() + " bytes");
                    }

                    // 서버의 화이트보드 상태 업데이트 (assets 포함)
                    if (message.getData() != null && !message.getData().isEmpty()) {
                        try {
                            // JSON 유효성 검사
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            mapper.readTree(message.getData());

                            // 상태 저장
                            serverWhiteboardState.put(serverId, message.getData());

                            // assets 별도 저장
                            if (message.getAssets() != null && !message.getAssets().isEmpty()) {
                                serverWhiteboardAssets.put(serverId, message.getAssets());
                            }

                            System.out.println(">>> 서버 " + serverId + " 상태 저장 완료 (assets 포함)");

                        } catch (Exception e) {
                            System.err.println(">>> 잘못된 데이터 형식, 저장 건너뜀: " + e.getMessage());
                        }
                    }

                    // 모든 연결에 브로드캐스트 (assets 포함)
                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
                    System.out.println(">>> 서버 " + serverId + "의 모든 연결에 변경사항 브로드캐스트 완료");

                    // 연결된 모든 클라이언트 수 확인
                    Set<String> connections = serverConnections.get(serverId);
                    System.out.println(">>> 브로드캐스트 대상 연결 수: " + (connections != null ? connections.size() : 0));
                    break;

                case "cursor-move":
                    System.out.println(">>> 서버 " + serverId + " 커서 이동 처리");
                    System.out.println(">>> 사용자: " + message.getUserName() + " (연결 ID: " + message.getConnectionId() + ")");

                    // 커서 위치를 모든 연결에 브로드캐스트
                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
                    System.out.println(">>> 커서 위치 브로드캐스트 완료");

                    // 연결된 모든 클라이언트 수 확인
                    Set<String> cursorConnections = serverConnections.get(serverId);
                    System.out.println(">>> 커서 브로드캐스트 대상 연결 수: " + (cursorConnections != null ? cursorConnections.size() : 0));
                    break;

                case "request-current-state":
                    System.out.println(">>> 서버 " + serverId + " 현재 상태 요청 처리");
                    System.out.println(">>> 요청자: " + message.getUserName() + " (연결 ID: " + message.getConnectionId() + ")");
                    sendCurrentWhiteboardState(serverId, message.getConnectionId());
                    break;

                default:
                    System.out.println(">>> 알 수 없는 메시지 타입: " + message.getType());
                    break;
            }

            // change, cursor-move, request-current-state 메시지는 이미 위에서 처리했으므로 중복 방지
            if (!"change".equals(message.getType()) &&
                    !"cursor-move".equals(message.getType()) &&
                    !"request-current-state".equals(message.getType())) {
                messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
            }

        } catch (Exception e) {
            System.err.println(">>> 메시지 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void addConnectionToServer(String serverId, String connectionId, String userId) {
        serverConnections.computeIfAbsent(serverId, k -> ConcurrentHashMap.newKeySet()).add(connectionId);
        connectionToUser.put(connectionId, userId);
        System.out.println(">>> 서버 " + serverId + "에 연결 추가: " + connectionId + " (사용자: " + userId + ")");
    }

    private void removeConnectionFromServer(String serverId, String connectionId) {
        Set<String> connections = serverConnections.get(serverId);
        if (connections != null) {
            connections.remove(connectionId);
            connectionToUser.remove(connectionId);
            System.out.println(">>> 서버 " + serverId + "에서 연결 제거: " + connectionId);

            if (connections.isEmpty()) {
                serverConnections.remove(serverId);
            }
        }
    }

    private void addUserToServer(String serverId, String userId) {
        Set<String> users = serverUsers.computeIfAbsent(serverId, k -> ConcurrentHashMap.newKeySet());
        boolean isNewUser = users.add(userId);
        int userCount = users.size();

        if (isNewUser) {
            System.out.println(">>> 서버 " + serverId + "에 새 사용자 추가: " + userId + " (총 " + userCount + "명)");
        } else {
            System.out.println(">>> 서버 " + serverId + "에 기존 사용자의 추가 연결: " + userId + " (총 " + userCount + "명)");
        }
    }

    private void removeUserFromServer(String serverId, String userId) {
        Set<String> users = serverUsers.get(serverId);
        if (users != null) {
            boolean removed = users.remove(userId);
            System.out.println(">>> 서버 " + serverId + "에서 사용자 제거: " + userId + " (제거됨: " + removed + ", 총 " + users.size() + "명)");

            if (users.isEmpty()) {
                serverUsers.remove(serverId);
                serverWhiteboardState.remove(serverId);
                serverWhiteboardAssets.remove(serverId);
                System.out.println(">>> 빈 서버 " + serverId + " 정리 완료");
            }
        }
    }

    private boolean hasOtherConnections(String serverId, String userId) {
        Set<String> connections = serverConnections.get(serverId);
        if (connections == null) return false;

        return connections.stream()
                .anyMatch(connectionId -> userId.equals(connectionToUser.get(connectionId)));
    }

    private void sendUserCount(String serverId) {
        Set<String> users = serverUsers.getOrDefault(serverId, ConcurrentHashMap.newKeySet());
        Set<String> connections = serverConnections.getOrDefault(serverId, ConcurrentHashMap.newKeySet());
        int userCount = users.size();
        int connectionCount = connections.size();

        WhiteboardMessage countMessage = new WhiteboardMessage();
        countMessage.setType("user-count");
        countMessage.setGroupId(serverId);
        countMessage.setData(String.valueOf(userCount));
        countMessage.setConnectionId("server-count");

        messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, countMessage);
        System.out.println(">>> 서버 " + serverId + " 실제 사용자 수 전송: " + userCount + "명 (연결 수: " + connectionCount + ")");
    }

    private void sendCurrentWhiteboardState(String serverId, String connectionId) {
        String currentState = serverWhiteboardState.get(serverId);
        String currentAssets = serverWhiteboardAssets.get(serverId);

        if (currentState != null && !currentState.isEmpty()) {
            WhiteboardMessage stateMessage = new WhiteboardMessage();
            stateMessage.setType("current-state");
            stateMessage.setGroupId(serverId);
            stateMessage.setData(currentState);
            stateMessage.setAssets(currentAssets);
            stateMessage.setConnectionId("server-state");

            messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, stateMessage);
            System.out.println(">>> 서버 " + serverId + "의 현재 화이트보드 상태 전송 완료");
            System.out.println(">>> 대상 연결: " + connectionId);
            System.out.println(">>> 상태 크기: " + currentState.length() + " bytes");
            System.out.println(">>> Assets 크기: " + (currentAssets != null ? currentAssets.length() : 0) + " bytes");
        } else {
            System.out.println(">>> 서버 " + serverId + "에 저장된 화이트보드 상태 없음 (새 화이트보드)");

            // 빈 상태라도 알림 전송
            WhiteboardMessage emptyStateMessage = new WhiteboardMessage();
            emptyStateMessage.setType("empty-state");
            emptyStateMessage.setGroupId(serverId);
            emptyStateMessage.setData("{}");
            emptyStateMessage.setConnectionId("server-state");

            messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, emptyStateMessage);
            System.out.println(">>> 빈 상태 알림 전송 완료");
        }
    }
}
