package com.example.moim.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomUserInfoVO { //로직 내부에서 인증 유저 정보를 저장해 둘 DTO
    private long userNo;
    private String username;
    private String userEmail;
    private String userNick;
    private String password;
    private Timestamp userLastLoggedDate;
}
