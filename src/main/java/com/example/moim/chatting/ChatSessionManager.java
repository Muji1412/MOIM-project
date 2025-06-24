package com.example.moim.chatting;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class ChatSessionManager {
    // 채널별 사용자 세션 관리 (채널명 -> 세션ID -> 사용자정보)
    private final Map<String, Map<String, UserInfo>> channelUsers = new ConcurrentHashMap<>();

    public void addUser(String channel, String sessionId, String username) {
        channelUsers.computeIfAbsent(channel, k -> new ConcurrentHashMap<>())
                .put(sessionId, new UserInfo(username, sessionId));
    }

    public void removeUser(String channel, String sessionId) {
        Map<String, UserInfo> users = channelUsers.get(channel);
        if (users != null) {
            users.remove(sessionId);
            if (users.isEmpty()) {
                channelUsers.remove(channel);
            }
        }
    }

    public List<String> getChannelUsers(String channel) {
        Map<String, UserInfo> users = channelUsers.get(channel);
        return users != null ?
                users.values().stream()
                        .map(UserInfo::getUsername)
                        .collect(Collectors.toList()) :
                new ArrayList<>();
    }

    // 모든 채널에서 해당 세션 제거
    public void removeUserFromAllChannels(String sessionId) {
        channelUsers.forEach((channel, users) -> users.remove(sessionId));
    }
}

//채팅 세션에 필요한 최소 정보만 포함
class UserInfo {
    private String username;      // 또는 userNick 사용
    private String sessionId;
    private long joinTime;       // 접속 시간

    public UserInfo(String username, String sessionId) {
        this.username = username;
        this.sessionId = sessionId;
        this.joinTime = System.currentTimeMillis();
    }

    // getters
    public String getUsername() { return username; }
    public String getSessionId() { return sessionId; }
    public long getJoinTime() { return joinTime; }
}
