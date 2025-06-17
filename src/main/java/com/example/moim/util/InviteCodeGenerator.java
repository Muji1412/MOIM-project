package com.example.moim.util;

import java.util.UUID;
import java.util.Base64;

public class InviteCodeGenerator {
    public static String generateSecureInviteCode(int length) {
        // UUID 생성
        UUID uuid = UUID.randomUUID();

        // UUID를 바이트로 변환 후 Base64로 인코딩
        String encoded = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(uuid.toString().getBytes());

        // 원하는 길이만큼 자르기
        return encoded.substring(0, Math.min(length, encoded.length()));
    }

    public static void main(String[] args) {
        String inviteCode = generateSecureInviteCode(10);
        System.out.println("안전한 초대코드: " + inviteCode);
    }
}
