package com.example.moim.dto;

public class WhiteboardMessage {
    private String type;        // "change", "cursor", "user-join", "user-leave"
    private String roomId;
    private String userId;
    private String userName;
    private String data;        // JSON 문자열로 저장

    // 기본 생성자
    public WhiteboardMessage() {}

    // 생성자
    public WhiteboardMessage(String type, String roomId, String userId, String userName, String data) {
        this.type = type;
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.data = data;
    }

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
