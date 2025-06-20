package com.example.moim.controller;

import com.example.moim.dto.whiteboard.WhiteboardClearEvent;
import com.example.moim.dto.whiteboard.WhiteboardCursorEvent;
import com.example.moim.dto.whiteboard.WhiteboardDrawEvent;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WhiteboardController {

    // 화이트보드 그리기 이벤트 처리
    @MessageMapping("/whiteboard/{projectId}/draw")
    @SendTo("/topic/whiteboard/{projectId}")
    public WhiteboardDrawEvent handleDrawEvent(
            @DestinationVariable String projectId,
            WhiteboardDrawEvent event) {

        // 그리기 데이터를 해당 프로젝트의 모든 참여자에게 브로드캐스트
        return event;
    }

    // 커서 움직임 이벤트 처리
    @MessageMapping("/whiteboard/{projectId}/cursor")
    @SendTo("/topic/whiteboard/{projectId}/cursor")
    public WhiteboardCursorEvent handleCursorMove(
            @DestinationVariable String projectId,
            WhiteboardCursorEvent event) {

        // 커서 위치를 다른 사용자들에게 실시간 전송
        return event;
    }

    // 화이트보드 초기화 이벤트
    @MessageMapping("/whiteboard/{projectId}/clear")
    @SendTo("/topic/whiteboard/{projectId}")
    public WhiteboardClearEvent handleClearEvent(
            @DestinationVariable String projectId,
            WhiteboardClearEvent event) {

        return event;
    }
}
