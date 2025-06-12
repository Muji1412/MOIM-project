package com.example.moim.command;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class TokenResponseVO {
    private String token;
    private String refreshToken;

    public TokenResponseVO(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
    }
}
