package com.example.moim.util;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request
                                        , HttpServletResponse response
                                        , AuthenticationException exception) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Throwable actualException = exception;
        if (exception instanceof InternalAuthenticationServiceException && exception.getCause() != null) {
            actualException = exception.getCause();
        }

        String message;

        if (actualException instanceof UsernameNotFoundException) {
            message = "존재하지 않는 사용자입니다.";
        } else if (actualException instanceof DisabledException) {
            message = "탈퇴한 계정입니다.";
        } else if (actualException instanceof BadCredentialsException) {
            message = "아이디 또는 비밀번호가 일치하지 않습니다.";
        } else {
            message = "로그인에 실패하였습니다.";
        }

        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
