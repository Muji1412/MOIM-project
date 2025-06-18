package com.example.moim.service.friendship;

import com.example.moim.command.FriendDTO;
import com.example.moim.entity.Friendship;
import com.example.moim.entity.Users;
import com.example.moim.repository.FriendshipRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.util.FriendshipId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendshipServiceImpl implements FriendshipService{

    private final FriendshipRepository friendshipRepository;
    private final UsersRepository usersRepository;

    // 친구추가 메서드
    // 이미 요청을 보냈거나 친구인 상태라면 익셉션 throw
    @Override
    public void sendFriendRequest(Long requesterId, Long receiverId) {
        FriendshipId friendshipId = new FriendshipId(requesterId, receiverId);
        if (friendshipRepository.findById(friendshipId).isPresent()) {
            throw new IllegalStateException("이미 요청을 보냈습니다.");
        }

        Friendship friendship = Friendship.builder()
                .id(friendshipId)
                .friendStat("PENDING")
                .build();
        friendshipRepository.save(friendship);
    }

    // 친구추가 Accept 메서드
    // 조회로 받아서 체크
    @Override
    public void acceptFriendRequest(Long accepterId, Long requesterId) {
        FriendshipId friendshipId = new FriendshipId(accepterId, requesterId);

        // 받은 친구추가 요청 있나 조회
        Friendship friendship = friendshipRepository.findById(friendshipId).isPresent() ? friendshipRepository.findById(friendshipId).get() : null;

        if (friendship != null) {
            friendship.setFriendStat("ACCEPTED");
            friendshipRepository.save(friendship);
        } else {
            throw new IllegalStateException("친구추가 요청이 존재하지 않습니다.");
        }
    }

    @Override
    public void rejectFriendRequest(Long accepterId, Long requesterId) {
        FriendshipId friendshipId = new FriendshipId(accepterId, requesterId);
        Friendship friendship = friendshipRepository.findById(friendshipId).isPresent() ? friendshipRepository.findById(friendshipId).get() : null;

        if (friendship != null) {
            friendshipRepository.delete(friendship);
        } else {
            throw new IllegalStateException("잘못된 요청입니다.");
        }
    }

    // 친구삭제 메서드
    @Override
    public void removeFriendship(Long accepterId, Long requesterId) {

        // 친구관계 조회 후 존재할시 처리, if-else문
        FriendshipId friendshipId = new FriendshipId(accepterId, requesterId);
        Friendship friendship = friendshipRepository.findById(friendshipId).isPresent() ? friendshipRepository.findById(friendshipId).get() : null;

        if (friendship != null) {
            friendshipRepository.delete(friendship);
        } else {
            throw new IllegalStateException("친구관계가 존재하지 않습니다.");
        }
    }
    
    // 친구목록 조회 메서드
    @Override
    public List<FriendDTO> getFriends(Long userId) {
        List<Friendship> friendships = friendshipRepository.findFriendsByUserId(userId);
        List<FriendDTO> friendDTOs = new ArrayList<>();

        for (Friendship friendship : friendships) {
            Long friendUserNo;
            // 현재 사용자가 userA라면 친구는 userB, 현재 사용자가 userB라면 친구는 userA
            if (friendship.getId().getUserA().equals(userId)) {
                friendUserNo = friendship.getId().getUserB();
            } else {
                friendUserNo = friendship.getId().getUserA();
            }

            // 친구의 Users 상세 정보를 조회
            Optional<Users> friendUserOptional = usersRepository.findByUserNo(friendUserNo);
            friendUserOptional.ifPresent(friendUser -> {
                // FriendDTO 생성자에 친구의 Users 정보와 Friendship의 userA, userB 정보를 전달
                friendDTOs.add(new FriendDTO(
                        friendUser,
                        friendship.getFriendStat(),
                        friendship.getId().getUserA(),
                        friendship.getId().getUserB()
                ));
            });
        }
        return friendDTOs;
    }
    
    // pending 중인 친구관계 가져오는 메서드
    @Override
    public List<FriendDTO> getPendingRequests(Long userId) {
        List<Friendship> pendingFriendships = friendshipRepository.findPendingRequestsToUser(userId);
        List<FriendDTO> pendingDTOs = new ArrayList<>();

        for (Friendship friendship : pendingFriendships) {
            Long requesterUserNo = friendship.getId().getUserA();

            Optional<Users> requesterUserOptional = usersRepository.findByUserNo(requesterUserNo);
            requesterUserOptional.ifPresent(requesterUser -> {
                pendingDTOs.add(new FriendDTO(
                        requesterUser, // 요청자의 정보
                        friendship.getFriendStat(),
                        friendship.getId().getUserA(), // 요청자 ID
                        friendship.getId().getUserB()  // 받는 사람 ID
                ));
            });
        }
        return pendingDTOs;
    }


}
