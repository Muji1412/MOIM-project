package com.example.moim.util;

import com.example.moim.jwt.JWTService;
import com.example.moim.jwt.TokenType;
import com.example.moim.service.user.CustomUserDetailsService;
import jakarta.servlet.http.Cookie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    //private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JWTService jwtService;
    public JWTAuthenticationFilter(CustomUserDetailsService customUserDetailsService, JWTService jwtService) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
//        System.out.println("jwt필터");
    }

    // 디버깅용 코드
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String servletPath = request.getServletPath();
        log.info("🔍 JWT Filter - Request Path: {}", servletPath);

        // 정적 리소스와 로그인 경로는 JWT 체크 제외
        if (servletPath.equals("/api/user/login") || servletPath.equals("/login.do") ||
                servletPath.equals("/user/login") ||
                servletPath.startsWith("/bundle/") ||
                servletPath.startsWith("/img/") ||
                servletPath.startsWith("/css/") ||
                servletPath.startsWith("/js/") ||
                servletPath.startsWith("/sw.js") ||
                servletPath.startsWith("/.well-known/")) {

            log.info("✅ JWT Filter - Skipping JWT check for path: {}", servletPath);
            filterChain.doFilter(request, response);
            return;
        }

        // Authorization 헤더에서 먼저 확인
        String header = request.getHeader("Authorization");
        String token = null;

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            log.info("🔍 JWT Filter - Token found in Authorization header");
        } else {
            // 헤더에 없으면 쿠키에서 확인
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("access_token".equals(cookie.getName())) { // 쿠키 이름 확인
                        token = cookie.getValue();
                        log.info("🔍 JWT Filter - Token found in cookie: access_token");
                        break;
                    }
                }
            }
        }

        if (token != null) {
            log.info("🔍 JWT Filter - Token extracted: {}...", token.substring(0, Math.min(token.length(), 20)));

            try {
                String tokenTypeStr = jwtService.parseClaims(token).get("tokenType", String.class);
                TokenType tokenType = TokenType.valueOf(tokenTypeStr);
                log.info("🔍 JWT Filter - Token type: {}", tokenType);

                if(jwtService.validateToken(token, tokenType)){
                    log.info("✅ JWT Filter - Token is valid");

                    String username = jwtService.getUsername(token);
                    log.info("🔍 JWT Filter - Username from token: {}", username);

                    UserDetails userDetails = (UserDetails) customUserDetailsService.loadUserByUsername(username);

                    if(userDetails != null) {
                        log.info("✅ JWT Filter - UserDetails loaded successfully for user: {}", username);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.info("✅ JWT Filter - Authentication set in SecurityContext for user: {}", username);
                    } else {
                        log.error("❌ JWT Filter - UserDetails is null for username: {}", username);
                    }
                } else {
                    log.error("❌ JWT Filter - Token validation failed");
                }
            } catch (Exception e) {
                log.error("❌ JWT Filter - Error processing token: {}", e.getMessage(), e);
            }
        } else {
            log.info("❌ JWT Filter - No token found in header or cookie");
        }

        // SecurityContext 상태 확인
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            log.info("✅ JWT Filter - User is authenticated: {}", auth.getName());
        } else {
            log.info("❌ JWT Filter - User is NOT authenticated");
        }

        filterChain.doFilter(request, response);
    }

    //jwt 토큰을 검증한다.
//    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
//        //httpRequest에서 헤더부분을 가져옴
//        String header = request.getHeader("Authorization");
//        String servletPath = request.getServletPath();
//        if (servletPath.equals("/api/user/login")||servletPath.equals("/login.do")||
//                servletPath.equals("/user/login")) {filterChain.doFilter(request, response); // 로그인은 JWT체크 X
//            return;
//        }
//        //헤더에 jwt가 있는지 확인
//        if(header != null && header.startsWith("Bearer ")){
//            String token = header.substring(7); //Bearer 떼고 토큰만 가져옴
//            String tokenTypeStr = jwtService.parseClaims(token).get("tokenType", String.class);
//            TokenType tokenType = TokenType.valueOf(tokenTypeStr);
//            //TokenType tokenType = jwtService.parseClaims(token).get("tokenType", TokenType.class);
//            //jwt 유효성 검증
//            if(jwtService.validateToken(token, tokenType)){
//                String username = jwtService.getUsername(token);
//                //유저와 토큰이 일치하면 userDetails 생성
//                UserDetails userDetails = (UserDetails) customUserDetailsService.loadUserByUsername(username);
//
//                if(userDetails != null) {
//                    //userDetails, password, Role 넣어서 토큰 생성
//                    UsernamePasswordAuthenticationToken authentication =
//                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//                    //현재 request의 security context에 접근권한 설정
//                    SecurityContextHolder.getContext().setAuthentication(authentication);
//                }
//            }
//        }
//
//        filterChain.doFilter(request, response);    //다음 필터로 넘김
//    }
}