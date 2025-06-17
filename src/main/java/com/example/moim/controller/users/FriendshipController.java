package com.example.moim.controller.users;

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
                .orElseThrow();
        Users userB = usersRepository.findByUsername(request.getReceiverUsername())
                .orElseThrow();

        Long A = userA.getUserNo();
        Long B = userB.getUserNo();

        try {
            friendshipService.sendFriendRequest(A, B);
            return ResponseEntity.ok().body("친구 요청이 전송되었습니다!");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

//    @PostMapping("/accept")
//    public ResponseEntity<?> acceptFriendship(@RequestBody FriendRequestDTO request) {
//        try {
//            friendshipService.acceptFriendRequest(request.getRequesterId(), request.getReceiverId());
//            return ResponseEntity.ok().body("친구 요청을 수락했습니다!");
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }
//
//    @PostMapping("/delete")
//    public ResponseEntity<?> deleteFriendship(@RequestBody FriendRequestDTO request) {
//        try {
//            friendshipService.removeFriendship(request.getRequesterId(), request.getReceiverId());
//            return ResponseEntity.ok().body("친구가 삭제됐습니다.");
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }

    @PostMapping("/list")
    public ResponseEntity<?> getFriends(@RequestBody UserIdDTO request){
        try {
            List<Friendship> friends = friendshipService.getFriends(request.getUserId());
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pending")
    public ResponseEntity<?> getPending(@RequestBody UserIdDTO request){
        try {
            List<Friendship> pendingList = friendshipService.getPendingRequests(request.getUserId());
            return ResponseEntity.ok(pendingList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject")
    public ResponseEntity<?> cancelRequest(@RequestBody UserIdDTO request) {

        try {
            friendshipService.removeFriendship(request.getUserA(), request.getUserB());
            return ResponseEntity.ok().body("");
        }catch (Exception e){
            return ResponseEntity.badRequest().body("dd");
        }
    }

    }

