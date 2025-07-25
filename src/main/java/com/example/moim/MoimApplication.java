package com.example.moim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MoimApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoimApplication.class, args);
    }

}
