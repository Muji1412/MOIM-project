package com.example.moim.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
public class ServiceWorkerController {

    @GetMapping(value = "/bundle/sw.js", produces = "application/javascript")
    public ResponseEntity<String> serviceWorker() {
        try {
            ClassPathResource resource = new ClassPathResource("static/bundle/sw.js");

            if (!resource.exists()) {
                System.err.println("❌ sw.js 파일을 찾을 수 없습니다");
                return ResponseEntity.notFound().build();
            }

            String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Type", "application/javascript");
            headers.add("Service-Worker-Allowed", "/");
            headers.add("Cache-Control", "no-cache, no-store, must-revalidate");

            System.out.println("✅ sw.js 파일 제공 성공!");
            return ResponseEntity.ok().headers(headers).body(content);

        } catch (Exception e) {
            System.err.println("❌ sw.js 파일 처리 실패: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
