package com.example.moim.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // bundle 경로 정적 리소스 매핑
        registry.addResourceHandler("/bundle/**")
                .addResourceLocations("classpath:/static/bundle/")
                .setCachePeriod(0); // 개발 중에는 캐시 비활성화

        // 서비스 워커 파일 특별 처리
//        registry.addResourceHandler("/bundle/sw.js")
//                .addResourceLocations("classpath:/static/bundle/")
//                .setCachePeriod(0)
//                .resourceChain(false); // 리소스 체인 비활성화
    }
}