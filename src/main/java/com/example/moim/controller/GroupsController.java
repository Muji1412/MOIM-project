package com.example.moim.controller;

import com.example.moim.entity.Groups;
import com.example.moim.service.groups.GroupsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupsController {

    private final GroupsService groupsService;

    @PostMapping
    public ResponseEntity<Groups> createGroup(
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        System.out.println("받은 그룹 이름: " + groupName);

        Groups groups = new Groups();
        groups.setGroupName(groupName);

        // 이미지 처리 로직 (필요시 추가)
        if (image != null && !image.isEmpty()) {
            System.out.println("이미지 파일: " + image.getOriginalFilename());
            // 이미지 저장 후 URL 설정
            // groups.setGroupImage(savedImageUrl);
        }

        Groups savedGroup = groupsService.createGroup(groups);
        System.out.println("저장된 그룹 ID: " + savedGroup.getGroupNo());

        return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
    }

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
    public ResponseEntity<Groups> updateGroup(@PathVariable Long groupNo, @RequestBody Groups groups) {
        return ResponseEntity.ok(groupsService.updateGroup(groupNo, groups));
    }

    @DeleteMapping("/{groupNo}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupNo) {
        groupsService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }
}
