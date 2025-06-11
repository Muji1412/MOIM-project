package com.example.moim.service.user;

import com.example.moim.command.LoginVO;
import com.example.moim.command.TokenResponseVO;
import com.example.moim.command.UserVO;
import com.example.moim.entity.Users;

public interface UserService {

    public Users signUp(UserVO userVO);
    public TokenResponseVO login(LoginVO loginVO);

}
