package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "refresh_token")
@Getter
@Setter
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_no")
    private Long tokenNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_no")
    private Users user;

    @Column(name = "token_cont")
    private String tokenCont;

    @Column(name = "token_created")
    private Timestamp tokenCreated;

    @Column(name = "token_expires")
    private Timestamp tokenExpires;

//    @Column(name = "user_agent")
//    private String userAgent;

}
