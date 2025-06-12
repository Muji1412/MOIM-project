package com.example.moim.service.user;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.entity.Users;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

@Data
public class CustomUserDetails implements UserDetails {

    private final CustomUserInfoVO customUserInfoVO;
    private final String userPhone;
    private final String userImg;
    private final String userMsg;

    public CustomUserDetails(CustomUserInfoVO customUserInfoVO
                            , String userPhone
                            , String userImg
                            , String userMsg) {
        this.customUserInfoVO = customUserInfoVO;
        this.userPhone = userPhone;
        this.userImg = userImg;
        this.userMsg = userMsg;
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
