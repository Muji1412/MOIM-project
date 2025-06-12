package com.example.moim.command;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PWChangeDTO {

    private String username;

    @NotNull(message = "기존의 비밀번호를 입력하세요")
    private String oldPw;

    @NotNull(message = "새로운 비밀번호를 입력하세요")
    private String newPw;
}
