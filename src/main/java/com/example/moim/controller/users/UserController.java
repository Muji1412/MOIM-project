package com.example.moim.controller.users;

import com.example.moim.service.user.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Slf4j
@Controller
@RequestMapping("/user")
public class UserController {

    //회원가입 페이지 진입
    @GetMapping("/signup")
    public String signup() {
        return "signup";
    }

    //로그인 페이지 진입
    @GetMapping("/login")
    public String login() {
        return "login";
    }

    //사용자 정보 확인 페이지
    @GetMapping("/myAccount")
    public ResponseEntity<?> getMyAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("userDetails: " + userDetails);

        return ResponseEntity.ok(userDetails);
    }

    //@사용자 정보 수정 페이지
    @GetMapping("/myAccount/modifyInfo")
    public String myAccountModifyInfo() {
        return "myAccount";
    }

    //비밀번호 수정 페이지
    @GetMapping("/myAccount/modifyPw")
    public String myAccountModifyPw() {
        return "modifyPw";
    }

    //비밀번호 찾기 페이지 - 비밀번호 찾기 메서드는 mailController에 있음
    @GetMapping("/searchPw")
    public String searchPw() {
        return "searchPw";
    }

}
