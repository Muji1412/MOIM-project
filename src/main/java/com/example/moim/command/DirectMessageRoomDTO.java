package com.example.moim.command;

import com.example.moim.entity.DirectMessageRoom;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class DirectMessageRoomDTO {
    private Long id;
    private Long user1No;
    private String user1Nick;
    private String user1Img;  // 추가
    private Long user2No;
    private String user2Nick;
    private String user2Img;  // 추가
    private LocalDateTime createdAt;

    public DirectMessageRoomDTO(DirectMessageRoom room) {
        this.id = room.getId();
        this.user1No = room.getUser1().getUserNo();
        this.user1Nick = room.getUser1().getUserNick();
        this.user1Img = room.getUser1().getUserImg();  // 추가
        this.user2No = room.getUser2().getUserNo();
        this.user2Nick = room.getUser2().getUserNick();
        this.user2Img = room.getUser2().getUserImg();  // 추가
        this.createdAt = room.getCreatedAt();
    }
}
