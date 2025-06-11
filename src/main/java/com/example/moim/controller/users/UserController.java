package com.example.moim.controller.users;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.command.LoginVO;
import com.example.moim.command.TokenResponseVO;
import com.example.moim.command.UserVO;
import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.service.user.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final JWTService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserController(UserService userService
                            , JWTService jwtService
                            , RefreshTokenRepository refreshTokenRepository) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserVO userVO) {
        System.out.println("요청 수신: " + userVO);
        try {
            Users savedUser = userService.signUp(userVO);
            return ResponseEntity.ok(Map.of("user", savedUser.getUsername(),
                                            "userNick", savedUser.getUserNick(),
                                            "userEmail", savedUser.getUserEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseVO> getMemberProfile(
            @Valid @RequestBody LoginVO loginVO
    ) {
        try {
            TokenResponseVO tokenResponseVO = this.userService.login(loginVO);
            log.info("tokenResponseVO: " + tokenResponseVO);
            return ResponseEntity.status(HttpStatus.OK).body(tokenResponseVO);
        } catch (IllegalArgumentException e) {
            //throw new RuntimeException(e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody TokenResponseVO tokenResponseVO) {
        String refreshToken = tokenResponseVO.getRefreshToken();

        if(!jwtService.validateToken(refreshToken)) {
            return  ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰이 만료되었거나 유효하지 않습니다.");
        }
        //토큰에서 사용자 아이디 가져옴. 이 아이디로 DB에서 refresh token을 확인함
        String username = jwtService.getUsername(refreshToken);
        Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findByTokenCont(refreshToken);
        if(storedTokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰을 찾을 수 없습니다.");
        }

        Users user = storedTokenOpt.get().getUser();

        //새 토큰 생성
        CustomUserInfoVO vo = new CustomUserInfoVO(
                user.getUserNo(),
                user.getUsername(),
                user.getUserEmail(),
                user.getUserNick(),
                null,
                user.getUserLastLoggedDate()
        );
        String newToken = jwtService.createToken(vo);
        String newRefreshToken = jwtService.createRefreshToken(vo);

        //기존 토큰 삭제
        refreshTokenRepository.delete(storedTokenOpt.get());

        RefreshToken newRefreshTokenEntity = new RefreshToken();
        newRefreshTokenEntity.setTokenCont(newRefreshToken);
        newRefreshTokenEntity.setUser(user);
        newRefreshTokenEntity.setTokenExpires(Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        refreshTokenRepository.save(newRefreshTokenEntity);

        return ResponseEntity.ok(new TokenResponseVO(newToken, newRefreshToken));
    }


}
