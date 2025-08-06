package com.example.moim.util;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class VapidKeyGenerator {
    public static void main(String[] args) throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        // P-256 곡선을 사용한 키 생성
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC", "BC");
        keyGen.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair keyPair = keyGen.generateKeyPair();

        // Base64 URL-safe 인코딩
        String publicKey = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(keyPair.getPublic().getEncoded());
        String privateKey = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(keyPair.getPrivate().getEncoded());


    }
}
