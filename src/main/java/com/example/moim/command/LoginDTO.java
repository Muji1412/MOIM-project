package com.example.moim.command;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginDTO {

    @NotNull(message = "아이디를 입력하세요")
    private String username;

    @NotNull(message = "비밀번호를 입력하세요")
    private String password;

}
