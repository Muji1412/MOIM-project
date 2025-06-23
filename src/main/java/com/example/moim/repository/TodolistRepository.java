package com.example.moim.repository;

import com.example.moim.entity.TodolistEntity;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodolistRepository extends JpaRepository<TodolistEntity,Long> {

    //List<TodolistEntity> getTodolist(@AuthenticationPrincipal CustomUserDetails user);
//    @Query("select t from TodolistEntity t where t.users.userNo = :userNo")
//    List<TodolistEntity> getTodolistByUserNoAndTodoEndAfter(long userNo, String todoEnd);

    @Query("SELECT t FROM TodolistEntity t WHERE t.users.userNo = :userNo AND t.todoEnd > :today")
    List<TodolistEntity> getByUserNoAndEndAfter(@Param("userNo") long userNo, @Param("today") String today);

    TodolistEntity getByTodoNo(long todoNo);

}