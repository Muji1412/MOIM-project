package com.example.moim.controller;

import com.example.moim.command.CreateInviteRequest;
import com.example.moim.entity.Groups;
import com.example.moim.entity.Users;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.GroupsInvite.GroupsInviteService;
import com.example.moim.service.user.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groupsInvite")
@RequiredArgsConstructor
@Tag(name = "그룹 초대", description = "그룹 초대 관련 API입니다")
public class GroupsInviteController {

    private final GroupsInviteService groupsInviteService;
    private final GroupsRepository groupsRepository;
    private final UsersRepository usersRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createInvite(@RequestBody CreateInviteRequest request) {
        String inviteCode;
        try {

            Groups groups = groupsRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 그룹입니다"));

            inviteCode = groupsInviteService.createInviteLink(request.getDays(), groups);

            String Link = "https://moim.o-r.kr/invite/" + inviteCode;

            return ResponseEntity.ok().body(Link);

        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinInvite(@RequestParam String inviteCode, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.badRequest().body("인증되지 않은 사용자입니다.");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        try {
            Users currentUser = usersRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다"));
//            System.out.println("에러 체크중, joinInvite 컨트롤러 메서드");
//            System.out.println("currentUser: " + currentUser);
//            System.out.println("inviteCode: " + inviteCode);
//            System.out.println(currentUser.getUserNo());
//            System.out.println(currentUser.getUsername());

            groupsInviteService.addUserToGroup(inviteCode, currentUser);

            // 테스트용 코드
//            Users testUser = usersRepository.findByUserNo(1L)
//                    .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다"));
//            groupsInviteService.addUserToGroup(inviteCode, testUser);

            return ResponseEntity.ok().body("그룹 참여가 완료됐습니다.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
