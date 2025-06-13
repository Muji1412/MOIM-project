package com.example.moim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ViewController {

        // 푸시 테스트용
        @GetMapping("/{pageName}.do")
        public String page(@PathVariable String pageName, Model model) {
            model.addAttribute("pageName", pageName);
            System.out.println("뷰이름:" + pageName);

            // 서비스 워커가 필요한 페이지일 경우
            if ("popupTest".equals(pageName) || "main".equals(pageName)) {
                System.out.println("왔다");
                return "example_with_sw"; // 서비스 워커가 포함된 HTML 리턴
            }
            System.out.println("안갔다");

            // 그 외의 모든 페이지는 기존 HTML 리턴
            return "example";
        }

    //    @GetMapping("/{pageName}.do") //.do 해주세요
//    public String page(@PathVariable String pageName, Model model) {
//        model.addAttribute("pageName", pageName);
//        System.out.println("뷰이름:" + pageName);
//
//        return "example"; //언제나 view화면으로 이동합니다.
//    }




}