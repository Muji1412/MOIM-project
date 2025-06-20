package com.example.moim.controller;

import com.example.moim.dto.WhiteboardMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;

@Controller
public class WhiteboardController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 화이트보드 변경사항 브로드캐스트
    @MessageMapping("/whiteboard/{roomId}")
    @SendTo("/sub/whiteboard/{roomId}")
    public WhiteboardMessage handleWhiteboardChange(WhiteboardMessage message) {
        System.out.println("화이트보드 메시지 수신: " + message.getType() + " from " + message.getUserName());
        return message;
    }

    // 특정 룸에만 메시지 전송
    public void sendToRoom(String roomId, Object message) {
        messagingTemplate.convertAndSend("/sub/whiteboard/" + roomId, message);
    }
}
