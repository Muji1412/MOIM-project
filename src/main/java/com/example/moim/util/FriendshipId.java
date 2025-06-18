package com.example.moim.util;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

// 복합키 클래스, 친구관계 엔티티 구현에 필요함
// A-B 둘을 묶어서 하나의 pk로 사용할것이므로 이렇게 구현
@Embeddable
@Getter
@NoArgsConstructor
@EqualsAndHashCode
public class FriendshipId implements Serializable {

    @Column(name = "USER_A")
    private Long userA;

    @Column(name = "USER_B")
    private Long userB;

    public FriendshipId(Long userA, Long userB){
        this.userA = userA;
        this.userB = userB;
    }

//    public FriendshipId(Long userA, Long userB) {
//        // 1 -> 2 친구 요청이 왔을때, 2->1은 친구가 아니라고 저장할수 있으므로 항상 A<B로 보장하여 주입
//        if (userA < userB) {
//            this.userA = userA;
//            this.userB = userB;
//        } else {
//            this.userA = userB;
//            this.userB = userA;
//        }
//    }
}
