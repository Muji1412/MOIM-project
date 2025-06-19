package com.example.moim.controller.users;

import com.example.moim.command.FriendDTO;
import com.example.moim.command.FriendRequestDTO;
import com.example.moim.command.UserIdDTO;
import com.example.moim.entity.Friendship;
import com.example.moim.entity.Users;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.friendship.FriendshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("api/friendship")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final UsersRepository usersRepository;

    // 친구추가
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody FriendRequestDTO request){

        log.info("sending friend request");
        log.info("request: {}", request);

        Users userA = usersRepository.findByUsername(request.getRequesterUsername())
                .orElseThrow(() -> new IllegalStateException("요청자를 찾을 수 없습니다."));
        Users userB = usersRepository.findByUsername(request.getReceiverUsername())
                .orElseThrow(() -> new IllegalStateException("수신자를 찾을 수 없습니다."));

        Long A = userA.getUserNo();
        Long B = userB.getUserNo();

        try {
            friendshipService.sendFriendRequest(A, B);
            return ResponseEntity.ok().body("친구 요청이 전송되었습니다!");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptFriendship(@RequestBody UserIdDTO request) {
        try {
            // requesterId(userA)와 accepterId(userB)를 서비스에 전달
            friendshipService.acceptFriendRequest(request.getUserA(), request.getUserB());
            return ResponseEntity.ok().body("친구 요청을 수락했습니다!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getFriends(@RequestBody UserIdDTO request){
        try {
            List<FriendDTO> friends = friendshipService.getFriends(request.getUserId());
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pending")
    public ResponseEntity<?> getPending(@RequestBody UserIdDTO request){
        try {
            List<FriendDTO> pendingList = friendshipService.getPendingRequests(request.getUserId());
            return ResponseEntity.ok(pendingList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectRequest(@RequestBody UserIdDTO request) {
        try {
            // 요청 거절을 위한 rejectFriendRequest 메소드 호출
            friendshipService.rejectFriendRequest(request.getUserA(), request.getUserB());
            return ResponseEntity.ok().body("친구 요청을 거절했습니다.");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteFriendship(@RequestBody UserIdDTO request) {
        try {
            friendshipService.removeFriendship(request.getUserA(), request.getUserB());
            return ResponseEntity.ok().body("친구가 삭제됐습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockFriendship(@RequestBody UserIdDTO request) {
        try {
            friendshipService.blockFriendship(request.getUserA(), request.getUserB());
            return ResponseEntity.ok().body("친구가 삭제됐습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
