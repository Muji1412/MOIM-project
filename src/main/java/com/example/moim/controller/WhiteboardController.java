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

    // 서버별 접속자 관리
    private static final ConcurrentHashMap<String, Set<String>> serverUsers = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, String> serverWhiteboardState = new ConcurrentHashMap<>();

    @MessageMapping("/whiteboard/{serverId}")  // /pub/whiteboard/{serverId}로 매핑
    public void handleWhiteboardMessage(@DestinationVariable String serverId, WhiteboardMessage message) {
        System.out.println("=== 서버 " + serverId + " 화이트보드 메시지 수신 ===");
        System.out.println("타입: " + message.getType());
        System.out.println("사용자: " + message.getUserName());
        System.out.println("연결 ID: " + message.getConnectionId());

        // message에 serverId 설정
        message.setGroupId(serverId);

        try {
            switch (message.getType()) {
                case "user-join":
                    System.out.println(">>> 사용자가 서버 " + serverId + " 화이트보드에 입장");
                    addUserToServer(serverId, message.getUserId());

                    // 새로 입장한 사용자에게 현재 화이트보드 상태 전송
                    sendCurrentWhiteboardState(serverId, message.getConnectionId());

                    // 모든 사용자에게 접속자 수 업데이트
                    sendUserCount(serverId);
                    break;

                case "user-leave":
                    System.out.println(">>> 사용자가 서버 " + serverId + " 화이트보드에서 퇴장");
                    removeUserFromServer(serverId, message.getUserId());
                    sendUserCount(serverId);
                    break;

                case "change":
                    System.out.println(">>> 서버 " + serverId + " 화이트보드 변경사항 처리");
                    System.out.println(">>> 연결 ID: " + message.getConnectionId() + "에서 변경");

                    // 서버의 화이트보드 상태 업데이트
                    serverWhiteboardState.put(serverId, message.getData());

                    // /sub 접두사 사용하여 브로드캐스트
                    messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);
                    System.out.println(">>> 서버 " + serverId + "의 모든 연결에 변경사항 브로드캐스트 완료");
                    return;
            }

            // 기타 메시지들도 /sub 접두사로 브로드캐스트
            messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, message);

        } catch (Exception e) {
            System.err.println(">>> 메시지 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void addUserToServer(String serverId, String userId) {
        serverUsers.computeIfAbsent(serverId, k -> ConcurrentHashMap.newKeySet()).add(userId);
        int userCount = serverUsers.get(serverId).size();
        System.out.println(">>> 서버 " + serverId + "에 사용자 추가: " + userId + " (총 " + userCount + "명)");
    }

    private void removeUserFromServer(String serverId, String userId) {
        Set<String> users = serverUsers.get(serverId);
        if (users != null) {
            users.remove(userId);
            System.out.println(">>> 서버 " + serverId + "에서 사용자 제거: " + userId + " (총 " + users.size() + "명)");

            if (users.isEmpty()) {
                serverUsers.remove(serverId);
                serverWhiteboardState.remove(serverId);
                System.out.println(">>> 빈 서버 " + serverId + " 정리 완료");
            }
        }
    }

    private void sendUserCount(String serverId) {
        Set<String> users = serverUsers.getOrDefault(serverId, ConcurrentHashMap.newKeySet());
        int userCount = users.size();

        WhiteboardMessage countMessage = new WhiteboardMessage();
        countMessage.setType("user-count");
        countMessage.setGroupId(serverId);
        countMessage.setData(String.valueOf(userCount));

        // /sub 접두사 사용
        messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, countMessage);
        System.out.println(">>> 서버 " + serverId + " 접속자 수 전송: " + userCount + "명");
    }

    private void sendCurrentWhiteboardState(String serverId, String connectionId) {
        String currentState = serverWhiteboardState.get(serverId);
        if (currentState != null) {
            WhiteboardMessage stateMessage = new WhiteboardMessage();
            stateMessage.setType("current-state");
            stateMessage.setGroupId(serverId);
            stateMessage.setData(currentState);
            stateMessage.setConnectionId("server-state");

            // /sub 접두사 사용
            messagingTemplate.convertAndSend("/sub/whiteboard/" + serverId, stateMessage);
            System.out.println(">>> 서버 " + serverId + "의 현재 화이트보드 상태를 모든 연결에 전송");
        }
    }
}
