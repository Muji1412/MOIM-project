package com.example.moim.chatting;

import lombok.Data;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;


import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ChatService {
    private final RedisTemplate<String, Object> redisTemplate;

    public ChatService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveChat(ChatMessage message) {
        redisTemplate.opsForList().rightPush("chat:" + message.getDate(), message);
    }

    public List<ChatMessage> getChatsByDate(String date) {
        return (List<ChatMessage>) (List<?>) redisTemplate.opsForList().range("chat:" + date, 0, -1);
    }

    // 전체 채팅 데이터 조회 메서드 추가
    public List<ChatMessage> getAllChats() {
        Set<String> keys = redisTemplate.keys("chat:*");
        List<ChatMessage> allChats = new ArrayList<>();
        if (keys != null) {
            for (String key : keys) {
                List<?> chatList = redisTemplate.opsForList().range(key, 0, -1);
                for (Object obj : chatList) {
                    if (obj instanceof ChatMessage) {
                        allChats.add((ChatMessage) obj);
                    }
                }
            }
        }
        return allChats;
    }

}
