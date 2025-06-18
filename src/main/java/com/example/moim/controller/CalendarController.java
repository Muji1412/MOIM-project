package com.example.moim.controller;

import com.example.moim.command.CalendarDTO;
import com.example.moim.entity.CalendarEntity;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.CalendarRepository;
import com.example.moim.service.user.CustomUserDetails;
import com.example.moim.service.user.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarRepository calendarRepository;

    public CalendarController(CalendarRepository calendarRepository) {
        this.calendarRepository = calendarRepository;
    }

    @PostMapping
    public List<CalendarDTO> getCalendar(@AuthenticationPrincipal CustomUserDetails user,
                                         @RequestParam long groupNo) {
        List<CalendarEntity> list = calendarRepository.getCalendarsByGroupNo(groupNo);
        return list.stream().map(CalendarDTO::new).collect(Collectors.toList());
    }
}
