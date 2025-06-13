package com.example.moim.config;

import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.security.Security;

@Configuration
public class WebPushConfig {

    @Value("${vapid.public-key}")
    private String publicKey;
    @Value("${vapid.private-key}")
    private String privateKey;
    @Value("${vapid.subject}")
    private String subject;

    @Bean
    public PushService pushService() throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        return new PushService(publicKey, privateKey, subject);
    }
}