package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;


@Entity
@Table(name = "channels")
@Getter
@Setter
public class Channels {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CHAN_NO")
    private Long chanNo;

    @Column(name = "GROUP_NO", nullable = false)
    private Long groupNo;  // 이것만 사용

    @Column(name = "channel_name", nullable = false, length = 40)
    private String chanName;

    @Column(name = "CHAN_IS_MULTI", length = 1)
    private String chanIsMulti;

    @Column(name = "CHAN_CREATED_AT")
    private Timestamp chanCreatedAt;

    @Column(name = "CHAN_LAST_MODIFIED")
    private Timestamp chanLastModified;

    // Groups 관계 매핑 제거
}
