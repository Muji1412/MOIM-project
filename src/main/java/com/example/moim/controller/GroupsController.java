package com.example.moim.controller;

import com.example.moim.entity.Groups;
import com.example.moim.entity.Users;
import com.example.moim.service.file.FileUploadService;
import com.example.moim.service.groups.GroupsService;
import com.example.moim.jwt.JWTService;
import com.example.moim.jwt.TokenType;
import com.example.moim.service.user.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupsController {

    private final GroupsService groupsService;
    private final FileUploadService fileUploadService;
    private final JWTService jwtService;

    @PostMapping
    public ResponseEntity<Groups> createGroup(
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();
        System.out.println("서버 생성 사용자: " + username);

        Groups groups = new Groups();
        groups.setGroupName(groupName);

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = fileUploadService.uploadFile(image, "group_img");
                groups.setGroupImage(imageUrl);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Groups savedGroup = groupsService.createGroup(groups, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
    }

    // 사용자별 서버 조회 (소유 + 초대받은 서버만)
    @GetMapping("/user")
    public ResponseEntity<List<Groups>> getUserGroups(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();
        System.out.println("=== 사용자 서버 조회 ===");
        System.out.println("사용자: " + username);

        List<Groups> userGroups = groupsService.getUserGroups(username);
        System.out.println("조회된 서버 수: " + userGroups.size());

        for (Groups group : userGroups) {
            System.out.println("- 그룹: " + group.getGroupName() + " (ID: " + group.getGroupNo() + ")");
        }

        return ResponseEntity.ok(userGroups);
    }

    // 전체 서버 조회 (관리자용) - 제거됨

    @GetMapping("/{groupNo}")
    public ResponseEntity<Groups> getGroup(
            @PathVariable Long groupNo,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();
        Groups group = groupsService.getGroup(groupNo);

        // 소유자만 접근 가능
        if (!groupsService.isOwner(groupNo, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(group);
    }

    @PutMapping("/{groupNo}")
    public ResponseEntity<Groups> updateGroup(
            @PathVariable Long groupNo,
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();

        if (!groupsService.isOwner(groupNo, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

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

    @DeleteMapping("/{groupNo}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupNo,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();

        if (!groupsService.isOwner(groupNo, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        groupsService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }

    // 서버 멤버 조회
    @GetMapping("/{groupNo}/members")
    public ResponseEntity<List<Users>> getGroupMembers(
            @PathVariable Long groupNo,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = userDetails.getUsername();

        // 소유자만 멤버 조회 가능
        if (!groupsService.isOwner(groupNo, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Users> members = groupsService.getGroupMembers(groupNo);
        return ResponseEntity.ok(members);
    }
}
