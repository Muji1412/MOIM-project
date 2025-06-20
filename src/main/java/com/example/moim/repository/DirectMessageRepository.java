package com.example.moim.repository;

import com.example.moim.entity.DirectMessage;
import com.example.moim.entity.DirectMessageRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    List<DirectMessage> findByRoomOrderBySentAtAsc(DirectMessageRoom room);
    @Query("SELECT dm FROM DirectMessage dm " +
            "JOIN FETCH dm.sender " +
            "WHERE dm.room = :room " +
            "ORDER BY dm.sentAt ASC")
    List<DirectMessage> findByRoomOrderBySentAtAscWithSender(@Param("room") DirectMessageRoom room);
}
