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
        // 파일 검증
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }

        String uuid = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 하드코딩 제거 - folderPath 그대로 사용
        String fileName;
        if (folderPath != null && !folderPath.isEmpty()) {
            fileName = folderPath + "/" + uuid + ext;
        } else {
            fileName = uuid + ext;
        }

        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                    .setContentType(file.getContentType())
                    .build();

            storage.create(blobInfo, file.getBytes());

            String fileUrl = "https://storage.googleapis.com/" + bucketName + "/" + fileName;
            System.out.println("파일 업로드 성공: " + fileUrl);

            return fileUrl;

        } catch (Exception e) {
            System.err.println("파일 업로드 실패: " + e.getMessage());
            throw new IOException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

}