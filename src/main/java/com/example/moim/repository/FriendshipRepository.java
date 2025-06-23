package com.example.moim.repository;

import com.example.moim.entity.Friendship;
import com.example.moim.util.FriendshipId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // 친구목록 조회 메서드
    @Query("SELECT f FROM Friendship f WHERE (f.id.userA = :userId OR f.id.userB = :userId) AND f.friendStat = 'ACCEPTED'")
    List<Friendship> findFriendsByUserId(@Param("userId") Long userId);

    // 받은 친구 초대 조회 메서드
    @Query("SELECT f FROM Friendship f WHERE f.id.userB = :receiverId AND f.friendStat = 'PENDING'")
    List<Friendship> findPendingRequestsToUser(@Param("receiverId") Long receiverId);

    // 친구관계 체크
    Optional<Friendship> findById(FriendshipId friendshipId);
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
            "((f.id.userA = :userA AND f.id.userB = :userB) OR " +
            "(f.id.userA = :userB AND f.id.userB = :userA)) AND " +
            "f.friendStat = 'ACCEPTED'")
    boolean areFriends(@Param("userA") Long userA, @Param("userB") Long userB);
}
