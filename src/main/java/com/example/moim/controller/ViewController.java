package com.example.moim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ViewController {

        @GetMapping("/{pageName}.do") //.do 해주세요
        public String page(@PathVariable String pageName, Model model) {
            model.addAttribute("pageName", pageName);
            System.out.println("뷰이름:" + pageName);

            return "example"; //언제나 view화면으로 이동합니다.
        }




//    @GetMapping({"/", "/login", "/chat", "/about", "/contact", "/products/**"})
//    public String mainApp() {
//        // "templates" 폴더가 아닌 "static" 폴더의 index.html을 직접 찾아 내부적으로 포워딩
//        return "forward:/index.html";
//    }
//
//    // MPA 테스트페이지
//    @GetMapping("/test")
//    public String testPage() {
//        return "forward:/test.html";
//    }
//
//    @GetMapping("/video-call/{roomId}")
//    public String videoCall(@PathVariable String roomId, Model model) {
//        // 필요하다면 여기서 모델에 데이터 추가
//        // "static" 폴더의 video.html을 직접 찾아 내부적으로 포워딩
//        return "forward:/video.html";
//    }
}