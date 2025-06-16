package com.example.moim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ViewController {

    // ✅ 메인 애플리케이션을 위한 핸들러
    @GetMapping({"/", "/home", "/servers/{serverId}"}) // React Router가 처리할 모든 경로
    public String mainApp(Model model) {
        // 모든 메인 앱 경로는 'main' 번들을 사용하도록 pageName 설정
        model.addAttribute("pageName", "main");
        return "example_with_sw"; // 서비스 워커가 포함된 템플릿 반환
    }

    // ✅ 기존의 다른 페이지 핸들러는 그대로 유지
    @GetMapping("/{pageName}.do")
    public String page(@PathVariable String pageName, Model model) {
        model.addAttribute("pageName", pageName);
        System.out.println("뷰이름:" + pageName);

        if ("popupTest".equals(pageName) || "main".equals(pageName)) {
            return "example_with_sw";
        }
        return "example";
    }
}