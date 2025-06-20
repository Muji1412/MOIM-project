package com.example.moim.controller;

import com.example.moim.command.CalendarDTO;
import com.example.moim.command.TodoListDTO;
import com.example.moim.entity.CalendarEntity;
import com.example.moim.service.user.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController("api/todoList")
public class TodoListController {

//    @PostMapping
//    public List<TodoListDTO> getCalendar(@AuthenticationPrincipal CustomUserDetails user,
//                                         @RequestParam long groupNo) {
//        List<CalendarEntity> list = calendarRepository.getCalendarsByGroupNo(groupNo);
//        return list.stream().filter(cal -> !cal.isCalIsDeleted())
//                .map(CalendarDTO::new).collect(Collectors.toList());
//    }

}
