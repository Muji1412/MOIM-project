package com.example.moim.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Slf4j
@Controller
public class ViewController {

    /**
     * React 애플리케이션의 기본 진입점을 처리합니다.
     * React Router가 클라이언트 사이드에서 처리할 모든 경로를 이 메소드가 받아서
     * 메인 HTML 뼈대(example_with_sw.html)를 반환하도록 합니다.
     * 이렇게 하면 사용자가 어떤 경로로 직접 접속하거나 새로고침해도 앱이 깨지지 않습니다.
     */
    @GetMapping({
            "/",
            "/main",
            "/home",
            "/home/**",        // 추가
            "/home/friends/**",    // 추가
            "/friends",             // 추가 (직접 접근용)
            "/friends/**",         // 추가 (직접 접근용)
            "/servers",
            "/servers/{serverId}", // 동적 경로도 포함
            "/popup",
            "/chat",
            "/calendar",
            "/todo"
    })


    public String mainAppEntry(Model model) {
        // 모든 경로는 'main' 번들을 사용하도록 pageName을 설정합니다.
        model.addAttribute("pageName", "main");
        // 서비스 워커가 포함된 템플릿을 반환합니다.
        return "example_with_sw";
    }

    // TODO API 요청은 제외하도록 설정하는거 고려하기
//    @GetMapping(value = "/{path:^(?!api).*}/**",
//            headers = "Accept=text/html")
//    public String catchAllForSPA(Model model) {
//        model.addAttribute("pageName", "main");
//        return "example_with_sw";
//    }

    @GetMapping("/{pageName}.do")
    public String separatePage(@PathVariable String pageName, Model model) {
        model.addAttribute("pageName", pageName);
        log.info(pageName + " 접속중");

        // 서비스 워커가 필요한 페이지인지 확인 (필요하다면)
        if ("popupTest".equals(pageName) || "chattingView".equals(pageName)) {
            return "example_with_sw";
        }
        return "example";
    }

    @GetMapping("/user/{pageName}.do")
    public String userPage(@PathVariable String pageName, Model model) {
        model.addAttribute("pageName", pageName);
        return "example";
    }

    @GetMapping("/invite/{inviteCode}")
    public String invitePage(@PathVariable String inviteCode) {
        log.info("inviteCode: {}", inviteCode);
        return "invite";
    }

    @GetMapping("/signup.do")
    public String signupPage() {
        return "signup";
    }
}
