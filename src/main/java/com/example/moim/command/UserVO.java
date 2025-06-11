package com.example.moim.command;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserVO {

    private String username;
    private String password;
    private String userEmail;
    private String userPhone;
    private String userNick;
    private String userImg;
    private String userMsg;
    private String userNId;
    private String userKId;
    private Timestamp userLastLoggedDate;
    private String userIsDeleted;

}
