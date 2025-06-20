package com.example.moim.dto.whiteboard;

public class WhiteboardDrawEvent {
    private String type;        // "start", "draw", "end"
    private double x;           // 마우스 X 좌표
    private double y;           // 마우스 Y 좌표
    private String color;       // 펜 색상
    private String tool;        // "pen", "eraser"
    private String userId;      // 사용자 ID
    private String userName;    // 사용자 이름
    private long timestamp;     // 시간 정보

    // 기본 생성자
    public WhiteboardDrawEvent() {}

    // 전체 생성자
    public WhiteboardDrawEvent(String type, double x, double y, String color, String tool, String userId, String userName, long timestamp) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = color;
        this.tool = tool;
        this.userId = userId;
        this.userName = userName;
        this.timestamp = timestamp;
    }

    // Getter와 Setter
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getTool() {
        return tool;
    }

    public void setTool(String tool) {
        this.tool = tool;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "WhiteboardDrawEvent{" +
                "type='" + type + '\'' +
                ", x=" + x +
                ", y=" + y +
                ", color='" + color + '\'' +
                ", tool='" + tool + '\'' +
                ", userId='" + userId + '\'' +
                ", userName='" + userName + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
