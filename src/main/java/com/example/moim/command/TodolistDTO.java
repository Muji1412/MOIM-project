package com.example.moim.command;

import com.example.moim.entity.TodolistEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TodolistDTO {
    private long todoNo;
    private long userNo;
    private String todoTitle;
    private String todoContent;
    private String todoStart;
    private String todoEnd;
    private String todoIsDone;

    public TodolistDTO(TodolistEntity e) {
        this.todoNo = e.getTodoNo();
        this.userNo = e.getUsers().getUserNo();
        this.todoTitle = e.getTodoTitle();
        this.todoContent = e.getTodoContent();
        this.todoStart = e.getTodoStart();
        this.todoEnd = e.getTodoEnd();
        this.todoIsDone = e.getTodoIsDone();
    }
}