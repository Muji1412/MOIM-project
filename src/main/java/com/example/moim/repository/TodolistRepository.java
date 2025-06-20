package com.example.moim.repository;

import com.example.moim.entity.TodolistEntity;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

//@Repository
//public interface TodolistRepository extends JpaRepository<TodolistEntity,Long> {
//
//    List<TodolistEntity> getTodolist(@AuthenticationPrincipal CustomUserDetails user);
//    List<TodolistEntity> getTodolistByUserNoAndTodoStart(long userNo, Timestamp todoStart);
//
//}
