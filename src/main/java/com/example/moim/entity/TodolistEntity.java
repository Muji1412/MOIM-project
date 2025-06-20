package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
public class TodolistEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "todo_no")
    private long todoNo; //할일번호

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_no")
    private Users users; //유저번호

    @JoinColumn(name = "todo_title")
    private String todoTitle; //할일제목

    @JoinColumn(name = "todo_content")
    private String todoContent; //할일내용

    @JoinColumn(name = "todo_start")
    private Timestamp todoStart; //할일시작일

    @JoinColumn(name = "todo_end")
    private Timestamp todoEnd; //할일마감일

    @JoinColumn(name = "todo_is_done")
    private String todoIsDone; //할일진행상태
}
