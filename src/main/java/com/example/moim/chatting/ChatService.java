package com.example.moim.chatting;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final RedisTemplate<String, Object> redisTemplate; // Redis 연동 객체
    private final Storage storage; // GCP Storage 연동 객체

    // 1. 채팅 메시지 저장 (채널+날짜별로 구분해서 Redis에 저장)
    // 개선된 키 패턴: chat:{groupName}:{channelName}
    public void saveChat(String groupName, String channelName, ChatMessage message) {
        String key = String.format("chat:%s:%s", groupName, channelName);

        // Redis List에 메시지 추가 (시간순 정렬 보장)
        redisTemplate.opsForList().rightPush(key, message);

    }

    // 2. 이미지 파일을 GCP에 업로드하고, 업로드된 이미지의 URL을 반환
    public String uploadImageToGCS(MultipartFile file) {
        String bucketName = "moim-bucket";

        // UUID로 고유한 파일명 생성
        String uuid = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = originalFilename != null
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        // chat-images 폴더에 저장
        String fileName = "chat-images/" + uuid + ext;

        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();
        try {
            storage.create(blobInfo, file.getBytes()); // 실제 업로드
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드 실패", e);
        }
        // 업로드된 이미지의 공개 URL 반환
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }


    // 채널별 전체 메시지 조회
    public List<ChatMessage> getChatsByChannel(String groupName, String channelName) {
        String key = String.format("chat:%s:%s", groupName, channelName);
        List<Object> rawMessages = redisTemplate.opsForList().range(key, 0, -1);

        List<ChatMessage> messages = new ArrayList<>();
        if (rawMessages != null) {
            for (Object obj : rawMessages) {
                if (obj instanceof ChatMessage) {
                    messages.add((ChatMessage) obj);
                }
            }
        }
        return messages;
    }


}
