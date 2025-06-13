package com.example.moim.controller.users;

import com.example.moim.command.LoginDTO;
import com.example.moim.command.PWChangeDTO;
import com.example.moim.command.TokenResponseVO;
import com.example.moim.command.UserVO;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.service.user.CustomUserDetails;
import com.example.moim.service.user.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    //회원 가입
    @PostMapping("/signUp")
    public ResponseEntity<?> signup(@RequestBody UserVO userVO) {
        System.out.println("요청 수신: " + userVO);
        try {
            Users savedUser = userService.signUp(userVO);
            return ResponseEntity.ok(Map.of(    "msg", "가입이 완료되었습니다",
                                            "userNick", savedUser.getUserNick()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponseVO> getMemberProfile(
            @Valid @RequestBody LoginDTO loginDTO
    ) {
        try {
            TokenResponseVO tokenResponseVO = this.userService.login(loginDTO);
            log.info("tokenResponseVO: " + tokenResponseVO);
            return ResponseEntity.status(HttpStatus.OK).body(tokenResponseVO);
        } catch (IllegalArgumentException e) {
            //throw new RuntimeException(e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    //액세스 토큰 만료 시 리프레쉬 토큰 확인해 액세스 토큰 재발급되는 곳
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody TokenResponseVO tokenResponseVO) {
        String refreshToken = tokenResponseVO.getRefreshToken();
        TokenResponseVO vo = userService.refresh(refreshToken);
        if(vo.getToken() == null) {
            return  ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("재로그인하세요");
        }

        return ResponseEntity.ok(vo);
    }

    //사용자 정보 확인
    @GetMapping("/myAccount")
    public ResponseEntity<?> getMyAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("userDetails: " + userDetails);

        return ResponseEntity.ok(userDetails);
    }

    //사용자 정보 수정(비밀번호 제외)
    @PostMapping("/myAccount/modifyInfo")
    public ResponseEntity<?> modifyInfo(@Valid @RequestBody UserVO userVO) {
        try {
            Users savedUser = userService.modifyInfo(userVO);
            return ResponseEntity.ok(Map.of(    "msg", "정보가 수정되었습니다.",
                                            "userNick", savedUser.getUserNick()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //비밀번호 수정
    @PostMapping("/myAccount/modifyPw")
    public ResponseEntity<?> modifyPw(@Valid @RequestBody PWChangeDTO pwChangeDTO) {
        try {
            Users pwChangedUser = userService.modifyPw(pwChangeDTO);
            return ResponseEntity.ok(Map.of(    "msg", "비밀번호가 변경되어 재 로그인이 필요합니다.",
                    "userNick", pwChangedUser.getUserNick()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //비밀번호 찾기 - 임시비밀번호 발급
    @PostMapping("/searchPw")
    public ResponseEntity<?> searchPw(@Valid @RequestBody PWChangeDTO pwChangeDTO) {


        return ResponseEntity.ok(null);
    }

}
