package com.example.moim.config;

import com.example.moim.jwt.JWTService;
import com.example.moim.service.user.CustomUserDetailsService;
import com.example.moim.util.JWTAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import com.example.moim.util.CustomAuthenticationEntryPoint;
import com.example.moim.util.CustomLoginFilter;
//import com.example.moim.util.JWTAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JWTService jwtService;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService
                            , JWTService jwtService
                            , CustomAuthenticationEntryPoint authenticationEntryPoint) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 개발 환경에서 사용하는 출처들을 명시적으로 나열합니다.
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",  // React 개발 서버 (예시)
                "http://localhost:8081",  // React 또는 다른 클라이언트가 8081 포트를 사용하는 경우
                "http://172.30.1.68:8081",
                "https://moim.o-r.kr",
                "http://localhost:8089"// 특정 IP로 접속하는 경우
                // 필요한 다른 출처가 있다면 추가
        ));
        //configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(Collections.singletonList("*")); // 모든 헤더 허용
        configuration.setAllowCredentials(true); // 자격 증명 허용
        configuration.setMaxAge(3600L);

        // WebSocket 연결을 위한 추가 설정
        configuration.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CustomLoginFilter customLoginFilter) throws Exception {
        http
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));

        http
                .authorizeHttpRequests(authorize -> authorize
                        // =================================================================
                        // 1. 페이지 로딩 및 인증 불필요 API는 모두 허용 (permitAll)
                        //    - 사용자가 사이트에 처음 접속할 때, 이 경로들은 인증 없이 접근 가능합니다.
                        // =================================================================
                        .requestMatchers(
                                // --- 페이지/라우팅 관련 경로 ---
                                "/error", "/*.do", "/user/**", "/invite/**",

                                // --- 인증 없이 호출해야 하는 API ---
                                "/api/user/login", "/api/user/signUp",
                                "/api/user/usernameCheck", "/api/user/emailCheck", "/api/user/nickCheck",
                                "/api/mail/searchPw", "/api/groupsInvite/join",

                                // --- 정적 리소스 (JS, CSS, 이미지 등) ---
                                "/bundle/**", "/img/**", "/css/**", "/js/**",
                                "/*.ico", "/*.json", "/*.png", "/sw.js",

                                // --- 웹소켓 경로 ---
                                "/ws/**"
                        ).permitAll()

                        // =================================================================
                        // 2. 위에서 허용한 것을 제외한 모든 /api/** 경로는 반드시 인증을 요구합니다.
                        // =================================================================
                        .requestMatchers("/api/**").authenticated()

                        // =================================================================
                        // 3. 그 외 나머지 모든 요청도 일단 인증을 요구 (안전장치)
                        // =================================================================
                        .anyRequest().authenticated()
                );

        http.formLogin(AbstractHttpConfigurer::disable);
        http.addFilterBefore(new JWTAuthenticationFilter(customUserDetailsService, jwtService), UsernamePasswordAuthenticationFilter.class);
        http.addFilterAt(customLoginFilter, UsernamePasswordAuthenticationFilter.class);
        http.exceptionHandling(handler -> handler.authenticationEntryPoint(authenticationEntryPoint));

        return http.build();
    }
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//        http
//                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                .csrf(csrf -> csrf.disable())
//                .authorizeHttpRequests(authorize -> authorize
//                        // ✅ 이 부분을 추가/수정합니다.
//                        .requestMatchers(
//                                // 정적 리소스들은 누구나 접근 가능
//                                "/bundle/**", "/img/**", "/css/**", "/js/**", "/favicon.ico",
//                                "/*.js", "/*.css", "/sw.js",
//                                // 로그인/회원가입 등 인증 없이 접근해야 하는 API
//                                "/api/user/login", "/api/user/signUp",
//                                "/api/user/usernameCheck", "/api/user/emailCheck", "/api/user/nickCheck",
//                                "/api/mail/searchPw",
//                                // 웹소켓 경로
//                                "/ws/**",
//                                // 메인 페이지 및 라우팅 경로
//                                "/", "/home", "/main", "/servers/**", "/*.do"
//                        ).permitAll()
//                        // 그 외 모든 요청은 인증 필요
//                        .anyRequest().authenticated()
//                );
//
//        http.formLogin(AbstractHttpConfigurer::disable);
//
//        http.addFilterBefore(new CustomLoginFilter(customUserDetailsService, jwtService), UsernamePasswordAuthenticationFilter.class);
//
//        http.exceptionHandling((exceptionhandler) -> exceptionhandler
//                .authenticationEntryPoint(authenticationEntryPoint));
//
//        return http.build();
//    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

//    @Bean
//    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
//        return config.getAuthenticationManager();
//    }

    @Bean
    public AuthenticationManager authenticationManager(
            HttpSecurity http, PasswordEncoder passwordEncoder, UserDetailsService userDetailsService) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder);
        return builder.build();
    }

    @Bean
    public CustomLoginFilter customLoginFilter(AuthenticationManager authenticationManager, JWTService jwtService) {
        CustomLoginFilter filter = new CustomLoginFilter(jwtService);
        filter.setAuthenticationManager(authenticationManager);
        return filter;
    }





}

//    @Bean
//    public CustomLoginFilter customLoginFilter(AuthenticationManager authenticationManager,
//                                                  JWTService jwtService) {
//        return new CustomLoginFilter(authenticationManager, jwtService);
//    }