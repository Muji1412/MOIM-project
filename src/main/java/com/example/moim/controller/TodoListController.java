package com.example.moim.controller;

import com.example.moim.command.TodolistDTO;
import com.example.moim.entity.TodolistEntity;
import com.example.moim.repository.TodolistRepository;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todoList")
public class TodoListController {

    private final TodolistRepository todolistRepository;

    public TodoListController(TodolistRepository todolistRepository) {
        this.todolistRepository = todolistRepository;
    }

    //할일 불러오기
    @PostMapping
    public List<TodolistDTO> getTodoList(@AuthenticationPrincipal CustomUserDetails user,
                                         @RequestParam long userNo) {
        String today = LocalDate.now().toString();
        List<TodolistEntity> list = todolistRepository.getByUserNoAndEndAfter(userNo, today);
        System.out.println("할일 리스트 DTO: "+list.stream().map(TodolistDTO::new).toList());
        return list.stream().map(TodolistDTO::new).collect(Collectors.toList());
    }

    //할일 수정
    @PostMapping("/modify")
    public ResponseEntity<?> modifyTodoList(TodolistDTO dto, @AuthenticationPrincipal CustomUserDetails user) {
        TodolistEntity entity = todolistRepository.getByTodoNo(dto.getTodoNo());
        entity.setTodoContent(dto.getTodoContent());
        entity.setTodoIsDone(dto.getTodoIsDone());
        entity.setTodoEnd(dto.getTodoEnd());
        entity.setTodoTitle(dto.getTodoTitle());
        try {
            todolistRepository.save(entity);
            System.out.println("할일 업데이트됨 : "+entity.toString());
            return  ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    //할일 삭제
    @PostMapping("/delete")
    public ResponseEntity<?> deleteTodoList(@AuthenticationPrincipal CustomUserDetails user,
                                            @RequestParam long todoNo) {
        TodolistEntity entity = todolistRepository.getByTodoNo(todoNo);
        try {
            todolistRepository.delete(entity);
            return  ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }


}
