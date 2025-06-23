package com.example.moim.dto;

public class WhiteboardMessage {
    private String type;        // "change", "cursor", "user-join", "user-leave"
    private String roomId;
    private String groupId;     // 서버 ID
    private String userId;
    private String userName;
    private String data;        // JSON 문자열로 저장
    private String connectionId; // 연결 ID 추가
    private String assets;      // assets 정보 추가

    // 기본 생성자
    public WhiteboardMessage() {}

    // 생성자 수정 (assets 포함)
    public WhiteboardMessage(String type, String roomId, String groupId, String userId, String userName, String data, String connectionId, String assets) {
        this.type = type;
        this.roomId = roomId;
        this.groupId = groupId;
        this.userId = userId;
        this.userName = userName;
        this.data = data;
        this.connectionId = connectionId;
        this.assets = assets;
    }

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getConnectionId() { return connectionId; }
    public void setConnectionId(String connectionId) { this.connectionId = connectionId; }

    public String getAssets() { return assets; }
    public void setAssets(String assets) { this.assets = assets; }

    @Override
    public String toString() {
        return "WhiteboardMessage{" +
                "type='" + type + '\'' +
                ", roomId='" + roomId + '\'' +
                ", groupId='" + groupId + '\'' +
                ", userId='" + userId + '\'' +
                ", userName='" + userName + '\'' +
                ", connectionId='" + connectionId + '\'' +
                ", dataLength=" + (data != null ? data.length() : 0) +
                ", assetsLength=" + (assets != null ? assets.length() : 0) +
                '}';
    }
}
