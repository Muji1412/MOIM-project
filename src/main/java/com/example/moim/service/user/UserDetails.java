package com.example.moim.service.user;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public interface UserDetails {
    String getUsername();
    String getPassword();
    long getUserNo();
    Collection<? extends GrantedAuthority> getAuthorities();
    boolean isAccountNonExpired();
    boolean isAccountNonLocked();
    boolean isCredentialsNonExpired();
}

//인증된 사용자의 정보를 담는 DTO 역할을 하는 인터페이스
//Spring Security는 내부적으로 로그인 요청이 오면 사용자의 정보를 이 UserDetails 객체에 담아 인증 여부를 판단