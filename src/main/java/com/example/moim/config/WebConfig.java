package com.example.moim.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/img/")
                .setCachePeriod(0);
        // bundle 경로 정적 리소스 매핑
        registry.addResourceHandler("/bundle/**")
                .addResourceLocations("classpath:/static/bundle/")
                .setCachePeriod(0); // 개발 중에는 캐시 비활성화

        // 서비스 워커 파일 특별 처리
//        registry.addResourceHandler("/bundle/sw.js")
//                .addResourceLocations("classpath:/static/bundle/")
//                .setCachePeriod(0)
//                .resourceChain(false); // 리소스 체인 비활성화

        // 서버 이미지 업로드 디렉토리 매핑 추가
        registry.addResourceHandler("/bundle/img/servers/**")
                .addResourceLocations("classpath:/static/bundle/img/servers/")
                .setCachePeriod(0); // 개발 중에는 캐시 비활성화

        // 업로드된 파일을 위한 외부 디렉토리 매핑 (선택사항)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(0);

        // 화이트보드 JavaScript 청크 파일들을 위한 매핑 추가
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCachePeriod(0);
    }
}
