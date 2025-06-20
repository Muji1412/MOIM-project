package com.example.moim.dto.whiteboard;

public class WhiteboardClearEvent {
    private String userId;      // 초기화를 실행한 사용자 ID
    private String userName;    // 사용자 이름
    private long timestamp;     // 시간 정보

    // 기본 생성자
    public WhiteboardClearEvent() {}

    // 전체 생성자
    public WhiteboardClearEvent(String userId, String userName, long timestamp) {
        this.userId = userId;
        this.userName = userName;
        this.timestamp = timestamp;
    }

    // Getter와 Setter
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
