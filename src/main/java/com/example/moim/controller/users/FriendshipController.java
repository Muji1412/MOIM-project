package com.example.moim.controller.users;

import com.example.moim.service.friendship.FriendshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("api/friendship")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    // 친구추가

//    @PostMapping("/FriendRequest")
//    public ResponseEntity<?> sendFriendRequest(Long requesterId, Long receiverId){
//        friendshipService.sendFriendRequest(requesterId, receiverId);
//
//    }

}
