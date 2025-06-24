package com.example.moim.util;

import com.example.moim.service.user.CustomUserDetailsService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final CustomUserDetailsService customUserDetailsService;

    public CustomAuthenticationEntryPoint(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        log.error("Not Authenticated: {}", authException.getMessage());

        String requestURI = request.getRequestURI();
        String accept = request.getHeader("Accept");

        // API 요청이거나 JSON을 요청하는 경우
        if (requestURI.startsWith("/api/") ||
                (accept != null && accept.contains("application/json"))) {

            // JSON 응답 반환
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"code\":\"401\",\"message\":\"Unauthorized\"}");
        } else {
            // 일반 페이지 요청은 리다이렉트
            response.sendRedirect("/login.do");
        }
    }
}
