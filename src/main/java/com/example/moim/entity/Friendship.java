package com.example.moim.entity;

import com.example.moim.util.FriendshipId;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

// 2. 엔티티 클래스
@Entity
@Table(name = "FRIENDSHIPS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @EmbeddedId
    private FriendshipId id;

    @Column(name = "FRIEND_STAT", length = 20)
    private String friendStat; // String으로 사용
}
