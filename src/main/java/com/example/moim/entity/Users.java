package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_NO")
    private Long userNo; //유저번호 - db저장시 자동 부여

    @Column(name = "USERNAME", nullable = false, unique = true)
    private String username; //아이디

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "USER_EMAIL", nullable = false, unique = true)
    private String userEmail;

    @Column(name = "USER_PHONE", nullable = false)
    private String userPhone;

    @Column(name = "USER_NICK", nullable = false, unique = true)
    private String userNick;

    @Column(name = "USER_IMG")
    private String userImg;

    @Column(name = "USER_MSG")
    private String userMsg;

    @Column(name = "USER_N_ID")
    private String userNId;

    @Column(name = "USER_K_ID")
    private String userKId;

    @Column(name = "USER_LAST_LOGGED_DATE")
    private Timestamp userLastLoggedDate;

    @Column(name = "USER_IS_DELETED")
    private String userIsDeleted;



}
