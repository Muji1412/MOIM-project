package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String endpoint;

    @Column(nullable = false)
    private String p256dh;

    @Column(nullable = false)
    private String auth;

    // ✅ 사용자 정보를 저장하기 위해 추가합니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_no") // Users 테이블의 기본 키(PK)와 연결
    private Users user;


    @Builder
    // ✅ 빌더에 user 파라미터를 추가합니다.
    public PushSubscription(String endpoint, String p256dh, String auth, Users user) {
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.user = user; // ✅ user 필드 초기화
    }
}