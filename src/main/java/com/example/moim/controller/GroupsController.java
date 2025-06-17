package com.example.moim.controller;

import com.example.moim.entity.Groups;
import com.example.moim.service.file.FileUploadService;
import com.example.moim.service.groups.GroupsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;

import java.io.File;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupsController {

    private final GroupsService groupsService;
    private final FileUploadService fileUploadService;

    @PostMapping
    public ResponseEntity<Groups> createGroup(
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Groups groups = new Groups();
        groups.setGroupName(groupName);

        // GCP 버킷 업로드로 변경
        if (image != null && !image.isEmpty()) {
            try {
                // "group_img" 폴더에 저장
                String imageUrl = fileUploadService.uploadFile(image, "group_img");
                groups.setGroupImage(imageUrl);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Groups savedGroup = groupsService.createGroup(groups);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
    }

//    @PostMapping
//    public ResponseEntity<Groups> createGroup(
//            @RequestParam("name") String groupName,
//            @RequestParam(value = "image", required = false) MultipartFile image
//    ) {
//        System.out.println("받은 그룹 이름: " + groupName);
//        System.out.println("받은 이미지: " + (image != null ? image.getOriginalFilename() : "null"));
//
//        Groups groups = new Groups();
//        groups.setGroupName(groupName);
//
//        // 이미지 처리 로직 (필요시 추가)
//        if (image != null && !image.isEmpty()) {
//            System.out.println("이미지 파일: " + image.getOriginalFilename());
//            try {
//                // 파일 저장 경로 설정
//                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/bundle/img/servers/";
//                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
//                String filePath = uploadDir + fileName;
//
//                // 디렉토리 생성
//                File directory = new File(uploadDir);
//                if (!directory.exists()) {
//                    boolean created = directory.mkdirs();
//                    System.out.println("디렉토리 생성: " + created + " - " + uploadDir);
//                }
//
//                // 파일 저장
//                File destinationFile = new File(filePath);
//                image.transferTo(destinationFile);
//
//                // 웹 경로 설정
//                String webPath = "/bundle/img/servers/" + fileName;
//                groups.setGroupImage(webPath);
//
//                System.out.println("이미지 저장 완료: " + webPath);
//                System.out.println("실제 파일 경로: " + filePath);
//            } catch (IOException e) {
//                System.err.println("이미지 저장 실패: " + e.getMessage());
//                e.printStackTrace();
//            }
//        }
//
//        Groups savedGroup = groupsService.createGroup(groups);
//        System.out.println("저장된 그룹 ID: " + savedGroup.getGroupNo());
//
//        return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
//    }

    @GetMapping("/{groupNo}")
    public ResponseEntity<Groups> getGroup(@PathVariable Long groupNo) {
        return ResponseEntity.ok(groupsService.getGroup(groupNo));
    }

    @GetMapping
    public ResponseEntity<List<Groups>> getAllGroups() {
        System.out.println("getAllGroups 호출됨");
        return ResponseEntity.ok(groupsService.getAllGroups());
    }

    @PutMapping("/{groupNo}")
    public ResponseEntity<Groups> updateGroup(
            @PathVariable Long groupNo,
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Groups existingGroup = groupsService.getGroup(groupNo);
        existingGroup.setGroupName(groupName);

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = fileUploadService.uploadFile(image, "group_img");
                existingGroup.setGroupImage(imageUrl);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Groups updatedGroup = groupsService.updateGroup(groupNo, existingGroup);
        return ResponseEntity.ok(updatedGroup);
    }


//    @PutMapping("/{groupNo}")
//    public ResponseEntity<Groups> updateGroup(
//            @PathVariable Long groupNo,
//            @RequestParam("name") String groupName,
//            @RequestParam(value = "image", required = false) MultipartFile image
//    ) {
//        System.out.println("서버 수정 요청 - ID: " + groupNo + ", 이름: " + groupName);
//
//        Groups existingGroup = groupsService.getGroup(groupNo);
//        existingGroup.setGroupName(groupName);
//
//        if (image != null && !image.isEmpty()) {
//            try {
//                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/bundle/img/servers/";
//                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
//                String filePath = uploadDir + fileName;
//
//                File directory = new File(uploadDir);
//                if (!directory.exists()) {
//                    directory.mkdirs();
//                }
//
//                File destinationFile = new File(filePath);
//                image.transferTo(destinationFile);
//
//                String webPath = "/bundle/img/servers/" + fileName;
//                existingGroup.setGroupImage(webPath);
//
//                System.out.println("이미지 수정 완료: " + webPath);
//            } catch (IOException e) {
//                System.err.println("이미지 저장 실패: " + e.getMessage());
//            }
//        }
//
//        Groups updatedGroup = groupsService.updateGroup(groupNo, existingGroup);
//        return ResponseEntity.ok(updatedGroup);
//    }


    @DeleteMapping("/{groupNo}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupNo) {
        groupsService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }
}
