package com.example.moim.service.user;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.entity.Users;
import com.example.moim.repository.UsersRepository;
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
        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
        customUserInfoVO.setUsername(user.getUsername());
        customUserInfoVO.setUserNo(user.getUserNo());
        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());
        customUserInfoVO.setPassword(user.getPassword());

        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
    }

    public UserDetails loadUserByUserNo(long userNo) throws UsernameNotFoundException {
        Users user = usersRepository.findByUserNo(userNo)
                .orElseThrow(() -> new UsernameNotFoundException("유저가 없습니다."));
        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
        customUserInfoVO.setUsername(user.getUsername());
        customUserInfoVO.setUserNo(user.getUserNo());
        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());
        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
    }
}

//@Service("customUserDetailsService")
//public class CustomUserDetailsService implements UserDetailsService {
//
//    private final UsersRepository usersRepository;
//    public CustomUserDetailsService(UsersRepository usersRepository) {
//        this.usersRepository = usersRepository;
//    }
//    @Override
//    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
//
//        //필터에서 jwt 토큰 유효성 검증 후 토큰에서 뽑아낸 username 값이 db에 있는지 확인
//        //확인되면 시큐리티 내부의 Auth 객체 UserPasswordAuthenticationToken 를 만들 때
//        //필요한 userDetails 객체(우리는 CustomUserDetails로 확장)로 만든다.
//        Users user = usersRepository.findByUsername(username).orElseThrow( ()-> new UsernameNotFoundException("유저가 없습니다."));
//        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
//        customUserInfoVO.setUsername(user.getUsername());
//        customUserInfoVO.setUserNo(user.getUserNo());
//        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());
//
//        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
//    }
//
//    @Override
//    public UserDetails loadUserByUserNo(long userNo) throws UsernameNotFoundException {
//
//        Users user = usersRepository.findByUserNo(userNo).orElseThrow( ()-> new UsernameNotFoundException("유저가 없습니다."));
//        CustomUserInfoVO customUserInfoVO = new CustomUserInfoVO();
//        customUserInfoVO.setUsername(user.getUsername());
//        customUserInfoVO.setUserNo(user.getUserNo());
//        customUserInfoVO.setUserLastLoggedDate(user.getUserLastLoggedDate());
//        return new CustomUserDetails(customUserInfoVO, user.getUserPhone(), user.getUserImg(), user.getUserMsg(), user.getUserNick());
//    }
//}
