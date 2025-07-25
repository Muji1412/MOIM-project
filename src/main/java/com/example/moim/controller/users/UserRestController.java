package com.example.moim.controller.users;

import com.example.moim.command.*;
import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.user.CustomUserDetails;
import com.example.moim.service.user.UserService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
//    @PostMapping("/login")
//    public ResponseEntity<?> getMemberProfile(
//            @Valid @RequestBody LoginDTO loginDTO
//    ) {
////        log.info(String.valueOf(loginDTO));
//        try {
//            TokenResponseVO tokenResponseVO = this.userService.login(loginDTO);
//            return ResponseEntity.status(HttpStatus.OK).body(tokenResponseVO);
//        } catch (IllegalArgumentException e) {
//            //throw new RuntimeException(e);
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
//        } catch (EntityNotFoundException e) {
//            return  ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "탈퇴한 사용자입니다"));
//        }
//    }

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
    public ResponseEntity<?> modifyInfo(@Valid @RequestBody MyAccountDTO myAccountDTO) {
        try {
            Users savedUser = userService.modifyInfo(myAccountDTO);
            return ResponseEntity.ok(Map.of(    "msg", "정보가 수정되었습니다.",
                                            "userNick", savedUser.getUserNick()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //비밀번호 수정
    @PostMapping("/myAccount/modifyPw")
    public ResponseEntity<?> modifyPw(@AuthenticationPrincipal CustomUserDetails userDetails,
                                      HttpServletResponse response,
                                      @Valid @RequestBody PWChangeDTO pwChangeDTO) {
        long userNo = userDetails.getUserNo();
        String username = userDetails.getUsername();
        try {
            Users pwChangedUser = userService.modifyPw(pwChangeDTO, username);
            RefreshToken e = refreshTokenRepository.findByUserUserNo(userNo)
                    .orElseThrow(() -> new EntityNotFoundException("토큰이 없습니다."));
            refreshTokenRepository.delete(e); //db에서 리프레시토큰 삭제
        } catch (EntityNotFoundException e) {
            return  ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

        Cookie accessTokenCookie = new Cookie("access_token", "");
        accessTokenCookie.setPath("/");
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setMaxAge(0); // 즉시 만료
        accessTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐

        Cookie refreshTokenCookie = new Cookie("refresh_token", "");
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setMaxAge(0);
        refreshTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐

        response.addCookie(accessTokenCookie);
        response.addCookie(refreshTokenCookie);
        //System.out.println("왜이래 또");
        return ResponseEntity.ok(Map.of(    "msg", "비밀번호가 변경되어 재 로그인이 필요합니다."));
    }

    //회원 탈퇴
    @PostMapping("/deleteAccount")
    public ResponseEntity<?> deleteAccount(@Valid @RequestParam String password,
                                           HttpServletResponse response) {
        //액세스토큰, 리프레시토큰 모두 삭제
        try {
            userService.deleteAccount(password);
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

        Cookie accessTokenCookie = new Cookie("access_token", "");
        accessTokenCookie.setPath("/");
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setMaxAge(0); // 즉시 만료
        accessTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐

        Cookie refreshTokenCookie = new Cookie("refresh_token", "");
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setMaxAge(0);
        refreshTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐

        response.addCookie(accessTokenCookie);
        response.addCookie(refreshTokenCookie);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-info")
    public ResponseEntity<?> getMyInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        // userDetails가 null이면 인증되지 않은 사용자이므로, SecurityConfig에서 접근을 막아주는 것이 좋습니다.
        if (userDetails == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        // CustomUserDetails에서 사용자 정보를 가져옵니다.
        // CustomUserDetails가 Users 엔티티의 모든 정보를 포함하고 있다고 가정합니다.
        // 필요에 따라 UsersRepository에서 직접 Users 엔티티를 조회하여 사용할 수도 있습니다.
        Users user = usersRepository.findByUserNo(userDetails.getUserNo())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 클라이언트에 반환할 데이터를 Map으로 구성 (비밀번호 제외)
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userNo", user.getUserNo());
        userInfo.put("username", user.getUsername());
        userInfo.put("userEmail", user.getUserEmail());
        userInfo.put("userPhone", user.getUserPhone());
        userInfo.put("userNick", user.getUserNick());
        userInfo.put("userImg", user.getUserImg());
        userInfo.put("userMsg", user.getUserMsg());
        userInfo.put("userNId", user.getUserNId());
        userInfo.put("userKId", user.getUserKId());
        userInfo.put("userLastLoggedDate", user.getUserLastLoggedDate());
        userInfo.put("userIsDeleted", user.isUserIsDeleted());
        // 비밀번호와 비밀번호 토큰은 민감 정보이므로 제외합니다.

        return ResponseEntity.ok(userInfo);
    }

    //유저넘버(user 테이블 pk)를 받아서 닉네임 등의 정보를 가져오는 메서드
    @PostMapping("/getInfo")
    public ResponseEntity<?> getInfo(@AuthenticationPrincipal CustomUserDetails userDetails,
                                     @RequestParam long userNo) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Invalidate User");
        }
        Optional<Users> user = usersRepository.findByUserNo(userNo);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자가 없습니다.");
        }
        return ResponseEntity.status(200).body(Map.of("username", user.get().getUsername()));
    }

    //로그아웃
//    @PostMapping("/logout")
//    public ResponseEntity<?> logout(@AuthenticationPrincipal CustomUserDetails userDetails,
//            HttpServletResponse response) {
//        long userNo = userDetails.getUserNo();
//        try {
//            RefreshToken e = refreshTokenRepository.findByUserUserNo(userNo)
//                    .orElseThrow(() -> new EntityNotFoundException("토큰이 없습니다."));
//            refreshTokenRepository.delete(e); //로그아웃시 db에서 리프레시토큰 삭제
//        } catch (Exception e) {
//            return  ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//
//        Cookie accessTokenCookie = new Cookie("access_token", "");
//        accessTokenCookie.setPath("/");
//        accessTokenCookie.setHttpOnly(true);
//        accessTokenCookie.setMaxAge(0); // 즉시 만료
//        accessTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐
//
//        Cookie refreshTokenCookie = new Cookie("refresh_token", "");
//        refreshTokenCookie.setPath("/");
//        refreshTokenCookie.setHttpOnly(true);
//        refreshTokenCookie.setMaxAge(0);
//        refreshTokenCookie.setDomain("localhost"); // 서버에 올릴 때는 서버주소로 해야 지워짐
//
//        response.addCookie(accessTokenCookie);
//        response.addCookie(refreshTokenCookie);
//        return ResponseEntity.ok().build();
//    }



}
