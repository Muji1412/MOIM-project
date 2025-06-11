package com.example.moim.service.user;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

public interface UserDetailsService {
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
}
