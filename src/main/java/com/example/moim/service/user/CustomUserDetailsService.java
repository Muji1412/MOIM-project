package com.example.moim.service.user;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.entity.Users;
import com.example.moim.repository.UsersRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;

@Service("customUserDetailsService")
public class CustomUserDetailsService implements UserDetailsService {

    private final UsersRepository usersRepository;
    public CustomUserDetailsService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }
    @Override
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("유저가 없습니다."));
        if(user.isUserIsDeleted()) {
            throw new DisabledException("탈퇴한 유저입니다.");
        }
        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
        customUserInfoVO.setUsername(user.getUsername());
        customUserInfoVO.setUserNo(user.getUserNo());
        customUserInfoVO.setPassword(user.getPassword());
        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());

        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
    }


//    public UserDetails loadUserByUserNo(long userNo) throws UsernameNotFoundException {
//        Users user = usersRepository.findByUserNo(userNo)
//                .orElseThrow(() -> new UsernameNotFoundException("유저가 없습니다."));
//        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
//        customUserInfoVO.setUsername(user.getUsername());
//        customUserInfoVO.setUserNo(user.getUserNo());
//        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());
//        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
//    }
}
