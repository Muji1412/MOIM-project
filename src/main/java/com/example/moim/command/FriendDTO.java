package com.example.moim.command;

import com.example.moim.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 친구 목록에 보여줄 친구의 상세 정보와 친구 관계 상태를 담는 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendDTO {
    private Long userNo; // 친구의 고유 번호
    private String username; // 친구의 아이디 (로그인 아이디)
    private String userNick; // 친구의 닉네임
    private String userImg; // 친구의 프로필 이미지 URL
    private String userMsg; // 친구의 상태 메시지
    private String friendStat; // 친구 관계 상태 (예: "ACCEPTED", "PENDING")

    private Long friendshipUserA;
    private Long friendshipUserB;

    public FriendDTO(Users user, String friendStat, Long userA, Long userB) {
        this.userNo = user.getUserNo();
        this.username = user.getUsername();
        this.userNick = user.getUserNick();
        this.userImg = user.getUserImg();
        this.userMsg = user.getUserMsg();
        this.friendStat = friendStat;
        this.friendshipUserA = userA;
        this.friendshipUserB = userB;
    }
}
