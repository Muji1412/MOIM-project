package com.example.moim.service.user;


import com.example.moim.command.*;
import com.example.moim.entity.Users;

public interface UserService {

    public Users signUp(UserVO userVO);
    public TokenResponseVO login(LoginDTO loginDTO);
    public TokenResponseVO refresh(String refreshToken);
    public Users modifyInfo(UserVO userVO);
    public Users modifyPw(PWChangeDTO pwChangeDTO);
    public String getTmpPw();
    public void updatePw(String tmpPw, String email);
    public boolean updatePwToken(String username, String email);
    public boolean deleteAccount(String password);
    public MyAccountDTO getMyAccount(long userNo);
}
