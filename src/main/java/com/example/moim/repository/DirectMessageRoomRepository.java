package com.example.moim.repository;

import com.example.moim.entity.DirectMessageRoom;
import com.example.moim.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DirectMessageRoomRepository extends JpaRepository<DirectMessageRoom, Long> {

    // 두 사용자로 채팅방 검색 (user1, user2 순서 모두 고려)
    @Query("SELECT r FROM DirectMessageRoom r WHERE (r.user1 = :userA AND r.user2 = :userB) OR (r.user1 = :userB AND r.user2 = :userA)")
    Optional<DirectMessageRoom> findRoomByUsers(@Param("userA") Users userA, @Param("userB") Users userB);

    // 특정 사용자가 참여중인 모든 채팅방 검색
    @Query("SELECT r FROM DirectMessageRoom r WHERE r.user1 = :user OR r.user2 = :user ORDER BY r.createdAt DESC")
    List<DirectMessageRoom> findAllByUser(@Param("user") Users user);

    // JOIN FETCH로 연관된 Users 엔티티를 함께 로딩
    @Query("SELECT dmr FROM DirectMessageRoom dmr " +
            "JOIN FETCH dmr.user1 " +
            "JOIN FETCH dmr.user2 " +
            "WHERE dmr.user1 = :user OR dmr.user2 = :user " +
            "ORDER BY dmr.createdAt DESC")
    List<DirectMessageRoom> findAllByUserWithUsers(@Param("user") Users user);

    @Query("SELECT dmr FROM DirectMessageRoom dmr " +
            "JOIN FETCH dmr.user1 " +
            "JOIN FETCH dmr.user2 " +
            "WHERE (dmr.user1 = :user1 AND dmr.user2 = :user2) " +
            "OR (dmr.user1 = :user2 AND dmr.user2 = :user1)")
    Optional<DirectMessageRoom> findRoomByUsersWithUsers(
            @Param("user1") Users user1,
            @Param("user2") Users user2);
}