package com.example.moim.service.file;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final Storage storage;


    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String folderPath) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = originalFilename != null
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        // 프로필 이미지 폴더 구조 적용
        String fileName = "profile-images/";
        if (folderPath != null && !folderPath.isEmpty()) {
            fileName += folderPath + "/";  // 사용자 ID 폴더
        }
        fileName += uuid + ext;

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(file.getContentType())
                .build();

        storage.create(blobInfo, file.getBytes());

        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }
}