package com.example.moim.entity;

import com.example.moim.util.UserGroupId;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USERGROUP")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGroup {

    @EmbeddedId
    private UserGroupId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GROUP_NO", insertable = false, updatable = false)
    private Groups group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO", insertable = false, updatable = false)
    private Users user;

    // 편의 생성자
    public UserGroup(Long groupNo, Long userNo) {
        this.id = new UserGroupId(groupNo, userNo);
    }
}
