package com.example.moim.service.user;

import com.example.moim.command.MailDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    //JavaMailSender는 스프링에서 제공해주는 메일 전송 인터페이스. 텍스트, html, 첨부파일까지 보낼 수 있다.
    private final JavaMailSender mailSender;
    //임시 비밀번호 발급 이메일에 보낼 제목과 내용을 미리 적어두고 임시 비밀번호만 생성하여 함께 전송
    private static final String EMAIL_SUBJECT = "MOIM 임시 비밀번호 발급 안내";
    private static final String EMAIL_CONTENT =  "MOIM 임시 비밀번호가 발급되었습니다."
            + "\n" + "아래의 임시 비밀번호로 로그인 후 반드시 비밀번호를 변경해주시기 바랍니다." + "\n";

    @Value("${spring.mail.username}")
    private String from;

    //클라이언트에서 입력받은 이메일과, 무작위 생성된 임시 비밀번호를 받아 MailDTO를 만든다
    public MailDTO createMail(String tmpPassword, String to) {
        return new MailDTO(from, to, EMAIL_SUBJECT, EMAIL_CONTENT+tmpPassword );
    }

    //SimpleMailMessage(메일 객체)를 만든 뒤 자바메일센더로 SimpleMailMessage를 전송
    public void sendMail(MailDTO mailDTO) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(from);
        mailMessage.setTo(mailDTO.to());
        mailMessage.setSubject(EMAIL_SUBJECT);
        mailMessage.setText(EMAIL_CONTENT);
        mailSender.send(mailMessage);
    }


    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
}
