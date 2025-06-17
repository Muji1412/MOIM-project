package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "GROUPS_INVITE")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GroupsInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INVITE_NO")
    private Long inviteNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GROUP_NO", nullable = false)
    private Groups group;

    @Column(name = "INVITE_CODE", length = 50, unique = true, nullable = false)
    private String inviteCode;

    @Column(name = "TIME_LIMIT")
    private Timestamp timeLimit;

}