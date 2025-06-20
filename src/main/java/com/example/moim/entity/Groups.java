package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Entity
@Table(name = "groups")
@Getter
@Setter
public class Groups {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GROUP_NO")
    private Long groupNo;

    @Column(name = "GROUP_NAME", nullable = false, length = 40)
    private String groupName;

    @Column(name = "GROUP_CREATED_AT")
    private Timestamp groupCreatedAt;

    @Column(name = "GROUP_OWNER_ID", length = 20)
    private String groupOwnerId;

    // 이미지 필드 추가
    @Column(name = "GROUP_IMAGE", length = 500) // 경로 저장을 위한 길이
    private String groupImage; // 이미지 파일 경로 저장

    // User 엔티티와의 관계 추가 (Users 엔티티가 있을 때만 활성화)
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "GROUP_OWNER_ID", referencedColumnName = "USER_ID", insertable = false, updatable = false)
    // private Users owner;
}
