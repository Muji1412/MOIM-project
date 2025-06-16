package com.example.moim.command;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class TokenResponseVO {
    private String accessToken;
    private String refreshToken;

    public TokenResponseVO(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
