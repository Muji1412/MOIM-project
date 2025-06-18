package com.example.moim.command;

import com.example.moim.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp; // Timestamp 임포트 추가

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
    private Timestamp requestDate; // 친구 요청 날짜 추가

    // Friendship 엔티티의 userA와 userB 정보를 포함하여,
    // frontend에서 친구 요청/수락/거절 시 어떤 관계의 userA, userB인지 식별할 수 있도록 합니다.
    private Long friendshipUserA;
    private Long friendshipUserB;

    /**
     * Users 엔티티와 친구 관계 상태, 그리고 Friendship ID의 userA, userB를 기반으로 FriendDTO를 생성합니다.
     * @param user 친구의 Users 엔티티
     * @param friendStat 친구 관계 상태 ("ACCEPTED", "PENDING")
     * @param userA Friendship ID의 userA
     * @param userB Friendship ID의 userB
     */
    public FriendDTO(Users user, String friendStat, Long userA, Long userB) {
        this.userNo = user.getUserNo();
        this.username = user.getUsername();
        this.userNick = user.getUserNick();
        this.userImg = user.getUserImg();
        this.userMsg = user.getUserMsg();
        this.friendStat = friendStat;
        this.friendshipUserA = userA;
        this.friendshipUserB = userB;
        this.requestDate = null; // Friendship 엔티티에 requestDate가 없으므로 초기값은 null로 설정
    }


    public FriendDTO(Users user, String friendStat, Long userA, Long userB, Timestamp requestDate) {
        this.userNo = user.getUserNo();
        this.username = user.getUsername();
        this.userNick = user.getUserNick();
        this.userImg = user.getUserImg();
        this.userMsg = user.getUserMsg();
        this.friendStat = friendStat;
        this.friendshipUserA = userA;
        this.friendshipUserB = userB;
        this.requestDate = requestDate;
    }
}
