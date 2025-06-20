package com.example.moim.controller;

import com.example.moim.command.TodolistDTO;
import com.example.moim.entity.TodolistEntity;
import com.example.moim.repository.TodolistRepository;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping
    public List<TodolistDTO> getTodoList(@AuthenticationPrincipal CustomUserDetails user,
                                            @RequestParam long userNo) {
        Date date = new Date();
        List<TodolistEntity> list = todolistRepository.getTodolistByUserNoAndTodoEndAfter(userNo, date.toString());
        return list.stream().map(TodolistDTO::new).collect(Collectors.toList());
    }

}
