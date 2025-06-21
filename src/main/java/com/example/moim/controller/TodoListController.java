package com.example.moim.controller;

import com.example.moim.command.TodolistDTO;
import com.example.moim.entity.TodolistEntity;
import com.example.moim.repository.TodolistRepository;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController("api/todoList")
public class TodoListController {

    private final TodolistRepository todolistRepository;

    public TodoListController(TodolistRepository todolistRepository) {
        this.todolistRepository = todolistRepository;
    }

    //할일 불러오기
    @PostMapping
    public List<TodolistDTO> getTodoList(@AuthenticationPrincipal CustomUserDetails user,
                                            @RequestParam long userNo) {
        System.out.println("씨발"+SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        System.out.println("여기까지 들어오긴 하는거임? "+user.getUsername());
        Date date = new Date();
        List<TodolistEntity> list = todolistRepository.getTodolistByUserNoAndTodoEndAfter(userNo, date.toString());
        System.out.println("할일 리스트 DTO: "+list.stream().map(TodolistDTO::new).toList());
        return list.stream().map(TodolistDTO::new).collect(Collectors.toList());
    }

}
