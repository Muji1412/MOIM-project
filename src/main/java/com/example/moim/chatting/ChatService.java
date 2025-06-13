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
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final RedisTemplate<String, Object> redisTemplate; // Redis 연동 객체
    private final Storage storage; // GCP Storage 연동 객체

    // 1. 채팅 메시지 저장 (채널+날짜별로 구분해서 Redis에 저장)
    public void saveChat(ChatMessage message) {
        // Redis의 리스트 자료구조에 메시지 추가
        // 키 예시: chat:general:2025-06-13
        redisTemplate.opsForList().rightPush("chat:" + message.getChannel() + ":" + message.getDate(), message);
    }


    // 2. 이미지 파일을 GCP에 업로드하고, 업로드된 이미지의 URL을 반환
    public String uploadImageToGCS(MultipartFile file) {
        String bucketName = "moim-bucket"; // GCP 버킷 이름
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename(); // 파일명 중복 방지
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();
        try {
            storage.create(blobInfo, file.getBytes()); // 실제 업로드
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드 실패", e);
        }
        // 업로드된 이미지의 공개 URL 반환
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }

    // 3. 채널+날짜별 메시지 조회 (프론트에서 새로고침/입장 시 사용)
    public List<ChatMessage> getChatsByChannelAndDate(String channel, String date) {
        // Redis에서 해당 채널+날짜의 메시지 리스트 불러오기
        List<Object> list = redisTemplate.opsForList().range("chat:" + channel + ":" + date, 0, -1);
        List<ChatMessage> result = new ArrayList<>();
        if (list != null) {
            for (Object obj : list) {
                if (obj instanceof ChatMessage) {
                    result.add((ChatMessage) obj);
                }
            }
        }
        return result;
    }
}
