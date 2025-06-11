package com.example.moim.service.user;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.entity.Users;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final CustomUserInfoVO customUserInfoVO;

    public CustomUserDetails(CustomUserInfoVO customUserInfoVO) {
        this.customUserInfoVO = customUserInfoVO;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
//        List<String> roles = new ArrayList<>();
//        roles.add("ROLE_" + member.getRole().toString());
//
//        return roles.stream()
//                .map(SimpleGrantedAuthority::new)
//                .collect(Collectors.toList());
    }

    @Override
    public String getUsername() {
        return customUserInfoVO.getUsername();
    }

    @Override
    public String getPassword() {
        return customUserInfoVO.getPassword();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }


}
