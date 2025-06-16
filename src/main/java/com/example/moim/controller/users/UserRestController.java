package com.example.moim.controller.users;

import com.example.moim.command.*;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.user.CustomUserDetails;
import com.example.moim.service.user.UserService;

import jakarta.persistence.EntityNotFoundException;
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
public class UserRestController {

    private final UserService userService;
    private final JWTService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UsersRepository usersRepository;

    public UserRestController(UserService userService
                            , JWTService jwtService
                            , RefreshTokenRepository refreshTokenRepository, UsersRepository usersRepository) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.usersRepository = usersRepository;
    }

    //아이디 중복 체크
    @GetMapping("/usernameCheck")
    public ResponseEntity<Boolean> checkId(@RequestParam String username) {
        boolean exists = usersRepository.existsByUsername(username);
        return ResponseEntity.ok(exists);
    }

    //이메일 중복 체크
    @GetMapping("/emailCheck")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String userEmail) {
        boolean exists = usersRepository.existsByUserEmail(userEmail);
        return ResponseEntity.ok(exists);
    }

    //닉네임 중복 체크
    @GetMapping("/nickCheck")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String userNick) {
        boolean exists = usersRepository.existsByUserNick(userNick);
        return ResponseEntity.ok(exists);
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
    public ResponseEntity<?> getMemberProfile(
            @Valid @RequestBody LoginDTO loginDTO
    ) {
        try {
            TokenResponseVO tokenResponseVO = this.userService.login(loginDTO);
            return ResponseEntity.status(HttpStatus.OK).body(tokenResponseVO);
        } catch (IllegalArgumentException e) {
            //throw new RuntimeException(e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (EntityNotFoundException e) {
            return  ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "탈퇴한 사용자입니다"));
        }
    }

    //액세스 토큰 만료 시 리프레쉬 토큰 확인해 액세스 토큰 재발급되는 곳
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody TokenResponseVO tokenResponseVO) {
        String refreshToken = tokenResponseVO.getRefreshToken();
        TokenResponseVO vo = userService.refresh(refreshToken);
        if(vo.getAccessToken() == null) {
            return  ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("재로그인하세요");
        }

        return ResponseEntity.ok(vo);
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
        } catch (EntityNotFoundException e) {
            return  ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    //회원 탈퇴
    @PostMapping("/deleteAccount")
    public ResponseEntity<?> deleteAccount(@Valid @RequestParam String password) {
        try {
            userService.deleteAccount(password);
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

        return ResponseEntity.ok("탈퇴가 완료되었습니다.");
    }



}
