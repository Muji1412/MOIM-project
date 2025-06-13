package com.example.moim.util;

import com.example.moim.jwt.JWTService;
import com.example.moim.jwt.TokenType;
import com.example.moim.service.user.CustomUserDetailsService;
import com.example.moim.service.user.UserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class CustomLoginFilter extends OncePerRequestFilter {

    //private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JWTService jwtService;
    public CustomLoginFilter(CustomUserDetailsService customUserDetailsService, JWTService jwtService) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
    }

    //jwt 토큰을 검증한다.
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        //httpRequest에서 헤더부분을 가져옴
        String header = request.getHeader("Authorization");

        //헤더에 jwt가 있는지 확인
        if(header != null && header.startsWith("Bearer ")){
            String token = header.substring(7); //Bearer 떼고 토큰만 가져옴
            String tokenTypeStr = jwtService.parseClaims(token).get("tokenType", String.class);
            TokenType tokenType = TokenType.valueOf(tokenTypeStr);
            //TokenType tokenType = jwtService.parseClaims(token).get("tokenType", TokenType.class);
            //jwt 유효성 검증
            if(jwtService.validateToken(token, tokenType)){
                String username = jwtService.getUsername(token);
                //유저와 토큰이 일치하면 userDetails 생성
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                if(userDetails != null) {
                    //userDetails, password, Role 넣어서 토큰 생성
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    //현재 request의 security context에 접근권한 설정
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);    //다음 필터로 넘김
    }
}

//    @Override
//    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
//        String id = request.getParameter("id");
//        String password = request.getParameter("password");
//        System.out.println("id: " + id + " password: " + password);
//        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(id, password);
//        return
//
//    }