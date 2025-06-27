package com.example.moim.util;

import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.service.user.CustomUserDetails;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;


    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            long userNo = userDetails.getUserNo();
            refreshTokenRepository.findByUserUserNo(userNo).ifPresent(refreshTokenRepository::delete);
            System.out.println("Logout triggered for user: " + userNo);
            System.out.println("LogoutSuccessHandler called. Authentication: " + authentication);


        }

         //쿠키 수동 삭제 (보완적)
        Cookie accessToken = new Cookie("access_token", "");
        accessToken.setPath("/");
        accessToken.setMaxAge(0);
        response.addCookie(accessToken);

        Cookie refreshToken = new Cookie("refresh_token", "");
        refreshToken.setPath("/");
        refreshToken.setMaxAge(0);
        response.addCookie(refreshToken);

        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write("Logout Success");
    }
}
