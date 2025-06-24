package com.example.moim.command;

import com.example.moim.entity.DirectMessage;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class DirectMessageDTO {
    private Long id;
    private Long roomId;
    private Long senderNo;
    private String senderNick;
    private String senderImg; // 이미지관련추가
    private String message;
    private LocalDateTime sentAt;


    public DirectMessageDTO(DirectMessage dm) {
        this.id = dm.getId();
        this.roomId = dm.getRoom().getId();
        this.senderNo = dm.getSender().getUserNo();
        this.senderNick = dm.getSender().getUserNick();
        this.senderImg = dm.getSender().getUserImg();
        this.message = dm.getMessage();
        this.sentAt = dm.getSentAt();

    }
}
