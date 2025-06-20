package com.example.moim.dto.whiteboard;

public class WhiteboardCursorEvent {
    private double x;           // 커서 X 좌표
    private double y;           // 커서 Y 좌표
    private String userId;      // 사용자 ID
    private String userName;    // 사용자 이름
    private long timestamp;     // 시간 정보

    // 기본 생성자
    public WhiteboardCursorEvent() {}

    // 전체 생성자
    public WhiteboardCursorEvent(double x, double y, String userId, String userName, long timestamp) {
        this.x = x;
        this.y = y;
        this.userId = userId;
        this.userName = userName;
        this.timestamp = timestamp;
    }

    // Getter와 Setter
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }

    public double getY() { return y; }
    public void setY(double y) { this.y = y; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
