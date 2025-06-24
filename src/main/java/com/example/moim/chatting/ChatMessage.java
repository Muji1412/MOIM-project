package com.example.moim.chatting;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class ChatMessage {
    private String date;
    private String user;
    private String color;
    private String text;
    private String imageUrl;
    private String channel;
    // 친구 검증용
    private Long user1No;
    private Long user2No;
}
