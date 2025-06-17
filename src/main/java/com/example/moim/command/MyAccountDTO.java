package com.example.moim.command;

public record MyAccountDTO(Long userNo
                            , String username
                            , String userEmail
                            , String userNick
                            , String userPhone
                            , String userImg
                            , String userMsg) {
}
