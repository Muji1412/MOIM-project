package com.example.moim.util;

import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.command.CustomUserInfoVO;
//import com.example.moim.jwt.TokenType;
//import com.example.moim.service.user.CustomUserDetailsService;
//import com.example.moim.service.user.UserDetails;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.service.user.CustomUserDetails;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.ZonedDateTime;
import java.util.Map;

public class CustomLoginFilter extends UsernamePasswordAuthenticationFilter {

    //private final AuthenticationManager authenticationManager;
//    private final CustomUserDetailsService customUserDetailsService;
    private final JWTService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    public CustomLoginFilter(JWTService jwtService, RefreshTokenRepository refreshTokenRepository) {
//        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
        setFilterProcessesUrl("/api/user/login"); // 로그인 경로 지정
        System.out.println(">>> [CustomLoginFilter] 생성자 호출됨");
    }

    //jwt 토큰을 검증한다.
    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
//        //httpRequest에서 헤더부분을 가져옴
//        String header = request.getHeader("Authorization");
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        System.out.println(">>> [CustomLoginFilter] setAuthenticationManager 호출됨, 값: " + authenticationManager);
        super.setAuthenticationManager(authenticationManager);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        // 폼 기반 로그인: application/x-www-form-urlencoded 방식
        //System.out.println(">>> [CustomLoginFilter] attemptAuthentication, 현재 AuthenticationManager: " + this.getAuthenticationManager());
        String username = obtainUsername(request); // == request.getParameter("username")
        String password = obtainPassword(request); // == request.getParameter("password")
        //System.out.println("username: " + username + ", password: " + password);

        UsernamePasswordAuthenticationToken authRequest =
                new UsernamePasswordAuthenticationToken(username, password);

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
//                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
        // 반드시 이 메서드로 호출
        Authentication authentication = this.getAuthenticationManager().authenticate(authRequest);
        //System.out.println("우웨엑 "+authentication.toString());
        return authentication;
    }

//                if(userDetails != null) {
//                    //userDetails, password, Role 넣어서 토큰 생성
//                    UsernamePasswordAuthenticationToken authentication =
//                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//                    //현재 request의 security context에 접근권한 설정
//                    SecurityContextHolder.getContext().setAuthentication(authentication);
//                }
//            }
//        }
          // 성공 실패처리 변경 - 쿠키도 추가
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

    // 쿠키에 토큰 저장
    Cookie accessCookie = new Cookie("access_token", accessToken);
    accessCookie.setHttpOnly(true);
    accessCookie.setSecure(false); // 로컬 개발 환경에서는 false, 배포 시에는 true로 설정하는 것이 좋습니다.
    accessCookie.setPath("/");
    accessCookie.setMaxAge(24 * 60 * 60); // 24시간

    Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
    refreshCookie.setHttpOnly(true);
    refreshCookie.setSecure(false); // 로컬 개발 환경에서는 false, 배포 시에는 true로 설정
    refreshCookie.setPath("/");
    refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7일

    response.addCookie(accessCookie);
    response.addCookie(refreshCookie);

    long userNo = cDetails.getUserNo();
    try {
        RefreshToken e = refreshTokenRepository.findByUserUserNo(userNo)
                .orElseThrow(() -> new EntityNotFoundException("토큰이 없습니다."));
        e.setTokenCont(refreshToken);
        e.setTokenCreated(new Timestamp(System.currentTimeMillis()));
        e.setTokenExpires(new Timestamp(System.currentTimeMillis() + 604800000));
        refreshTokenRepository.save(e); //db 에서 해당 유저 row 에 새 리프레시토큰값 넣음
        System.out.println("기존유저 리프레시토큰 새로고침");
    } catch (EntityNotFoundException e) {
      RefreshToken e2 = new RefreshToken();
      Users user = new Users();
      user.setUserNo(userNo);
      e2.setUser(user);
      e2.setTokenCont(refreshToken);
      e2.setTokenCreated(new Timestamp(System.currentTimeMillis()));
      e2.setTokenExpires(new Timestamp(System.currentTimeMillis() + 604800000));
      refreshTokenRepository.save(e2);
        System.out.println("신규유저 리프레시토큰 등록");
    } catch (Exception e) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }

    // ✅ 응답 본문을 비우고 성공 상태 코드(200 OK)만 보냅니다.
    response.setStatus(HttpServletResponse.SC_OK);
}


//        // 이하 성공/실패 처리
//        @Override
//        protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
//                                                FilterChain chain, Authentication authResult)
//                throws ServletException, IOException {
//            CustomUserInfoVO vo = new CustomUserInfoVO();
//            CustomUserDetails cDetails = (CustomUserDetails) authResult.getPrincipal();
//            vo.setUserNo(cDetails.getUserNo());
//            vo.setUsername(cDetails.getUsername());
//            vo.setPassword(cDetails.getPassword());
//            vo.setUserLastLoggedDate(cDetails.getCustomUserInfoVO().getUserLastLoggedDate());
//            String accessToken = jwtService.createToken(vo);
//            String refreshToken = jwtService.createRefreshToken(vo);
//        //        System.out.println("여기까지 왔음");
//
////        filterChain.doFilter(request, response);    //다음 필터로 넘김
//            response.setContentType("application/json");
//            response.getWriter().write("{\"accessToken\":\"" + accessToken + "\"," + "\"refreshToken\":\"" + refreshToken +"\"}");
////        System.out.println("액세스토큰 "+accessToken);
//        }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed)
            throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_BAD_GATEWAY);
        response.getWriter().write("{\"error\": \"로그인 실패\"}");
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