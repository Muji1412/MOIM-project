package com.example.moim.controller;

import com.example.moim.entity.Groups;
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

//    HttpServletRequest request
    @PostMapping
    public ResponseEntity<Groups> createGroup(
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
//        // JWT 토큰에서 사용자 정보 추출
//        String currentUserId = extractUserFromRequest(request);

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        System.out.println("userId: " + userId);
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

        Groups savedGroup = groupsService.createGroup(groups, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
    }

    //HttpServletRequest request
    @GetMapping
    public ResponseEntity<List<Groups>> getUserGroups(@AuthenticationPrincipal CustomUserDetails customUserDetails ) {
        //String currentUserId = extractUserFromRequest(request);
        if (        customUserDetails
                == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = customUserDetails.getUsername();

        List<Groups> userGroups = groupsService.getUserGroups(userId);
        return ResponseEntity.ok(userGroups);
    }

    @GetMapping("/{groupNo}")
    public ResponseEntity<Groups> getGroup(
            @PathVariable Long groupNo,
            HttpServletRequest request
    ) {
        String currentUserId = extractUserFromRequest(request);

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Groups group = groupsService.getGroup(groupNo);

        if (!groupsService.isOwner(groupNo, currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(group);
    }

    @PutMapping("/{groupNo}")
    public ResponseEntity<Groups> updateGroup(
            @PathVariable Long groupNo,
            @RequestParam("name") String groupName,
            @RequestParam(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        String currentUserId = extractUserFromRequest(request);

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!groupsService.isOwner(groupNo, currentUserId)) {
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
            HttpServletRequest request
    ) {
        String currentUserId = extractUserFromRequest(request);

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!groupsService.isOwner(groupNo, currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        groupsService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }

    // JWT 토큰에서 사용자 정보 추출하는 메서드
    private String extractUserFromRequest(HttpServletRequest request) {
        try {
            String bearerToken = request.getHeader("Authorization");
            System.out.println(bearerToken + "입니다~~~~");

            if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
                return null;
            }

            String token = bearerToken.substring(7);

            // JWT 토큰 검증 및 사용자 정보 추출
            if (jwtService.validateToken(token, TokenType.ACCESS)) {
                return jwtService.getUsername(token); // "test11" 반환
            }

            return null;
        } catch (Exception e) {
            System.err.println("JWT 토큰 처리 실패: " + e.getMessage());
            return null;
        }
    }
}
