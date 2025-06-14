package com.example.moim.chatting;

import lombok.Data;

@Data
public class ChatMessage {
    private String date;
    private String user;
    private String color;
    private String text;
    private String imageUrl;
    private String channel;
}
