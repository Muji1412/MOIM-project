package com.example.moim.chatting;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Storage storage; // Google Cloud Storage 클라이언트

//    @Autowired
//    public ChatService(RedisTemplate<String, Object> redisTemplate, Storage storage) {
//        this.redisTemplate = redisTemplate;
//        this.storage = storage;
//    }

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
    // 파일업로드
    public String uploadImageToGCS(MultipartFile file) {
        String bucketName = "moim-bucket";
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();
        try {
            storage.create(blobInfo, file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드 실패", e);
        }
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }


}
