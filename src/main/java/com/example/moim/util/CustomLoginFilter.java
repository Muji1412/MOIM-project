package com.example.moim.util;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.jwt.JWTService;
import com.example.moim.service.user.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

public class CustomLoginFilter extends UsernamePasswordAuthenticationFilter {

    private final JWTService jwtService;

    public CustomLoginFilter(JWTService jwtService) {
        this.jwtService = jwtService;
        setFilterProcessesUrl("/api/user/login"); // 로그인 경로 지정
        System.out.println(">>> [CustomLoginFilter] 생성자 호출됨");
    }

    @Override
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        System.out.println(">>> [CustomLoginFilter] setAuthenticationManager 호출됨, 값: " + authenticationManager);
        super.setAuthenticationManager(authenticationManager);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        // 폼 기반 로그인: application/x-www-form-urlencoded 방식
        System.out.println(">>> [CustomLoginFilter] attemptAuthentication, 현재 AuthenticationManager: " + this.getAuthenticationManager());
        String username = obtainUsername(request); // == request.getParameter("username")
        String password = obtainPassword(request); // == request.getParameter("password")
        System.out.println("username: " + username + ", password: " + password);

        UsernamePasswordAuthenticationToken authRequest =
                new UsernamePasswordAuthenticationToken(username, password);

        // 반드시 이 메서드로 호출
        Authentication authentication = this.getAuthenticationManager().authenticate(authRequest);
        System.out.println("우웨엑 "+authentication.toString());
        return authentication;
    }

    // 이하 성공/실패 처리
    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication authResult)
            throws ServletException, IOException {
        CustomUserInfoVO vo = new CustomUserInfoVO();
        CustomUserDetails cDetails = (CustomUserDetails) authResult.getPrincipal();
        vo.setUserNo(cDetails.getUserNo());
        vo.setUsername(cDetails.getUsername());
        vo.setPassword(cDetails.getPassword());
        vo.setUserLastLoggedDate(cDetails.getCustomUserInfoVO().getUserLastLoggedDate());
        String accessToken = jwtService.createToken(vo);
        String refreshToken = jwtService.createRefreshToken(vo);
//        System.out.println("여기까지 왔음");

        response.setContentType("application/json");
        response.getWriter().write("{\"accessToken\":\"" + accessToken + "\"," + "\"refreshToken\":\"" + refreshToken +"\"}");
        System.out.println("액세스토큰 "+accessToken);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed)
            throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_BAD_GATEWAY);
        response.getWriter().write("{\"error\": \"로그인 실패\"}");
    }
}

