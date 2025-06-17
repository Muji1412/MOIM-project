package com.example.moim.controller;

import com.example.moim.command.CreateInviteRequest;
import com.example.moim.entity.Groups;
import com.example.moim.entity.Users;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.GroupsInvite.GroupsInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groupsInvite")
@RequiredArgsConstructor
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

            String Link = "moim.o-r.kr/invite/" + inviteCode + "/";

            return ResponseEntity.ok().body(Link);

        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinInvite(@RequestParam String inviteCode,
                                        @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Users currentUser = usersRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다"));

            groupsInviteService.addUserToGroup(inviteCode, currentUser);

            return ResponseEntity.ok().body("그룹 참여가 완료됐습니다.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
