package com.example.moim.controller.users;

import com.example.moim.command.MailDTO;
import com.example.moim.command.PWChangeDTO;
import com.example.moim.command.TmpPwDTO;
import com.example.moim.entity.Users;
import com.example.moim.service.user.MailService;
import com.example.moim.service.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mail/")
public class MailController {

    private final MailService mailService;
    private final UserService userService;



    //비밀번호 찾기 - 임시비밀번호 발급
    @PostMapping("/searchPw")
    public ResponseEntity<?> searchPw(@Valid @RequestBody TmpPwDTO tmpPwDTO) {

        try {
            //입력한 아이디와 이메일이 맞는지 확인하여 유저 검증 후 가장 최근에 임시비밀번호를 재발급받았는지를 boolean으로 확인
            boolean isEmailValid = userService.updatePwToken(tmpPwDTO.username(), tmpPwDTO.userEmail());
            if (isEmailValid) { //true인 경우 임시비밀번호를 재발급받을 수 있음
                //임시비밀번호 생성
                String tmpPw = userService.getTmpPw();
                //DB에 임시비밀번호 업데이트
                userService.updatePw(tmpPw,  tmpPwDTO.userEmail());
                //메일 전송
                MailDTO mailDTO = mailService.createMail(tmpPw, tmpPwDTO.userEmail());
                System.out.println("record가 문제? "+mailDTO.toString());
                mailService.sendMail(mailDTO);
            } else { // false인 경우 아이디와 이메일은 맞으나 임시비밀번호 재발급 1시간 지나지 않음
                return ResponseEntity.badRequest().body("임시 비밀번호는 1시간 당 한 번만 발급 가능합니다.");
            }
            return ResponseEntity.ok("임시 비밀번호가 발급되었습니다.");
        } catch (EntityNotFoundException e) {
            //아이디와 이메일을 맞지 않게 반환한 경우 exception 발생
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
