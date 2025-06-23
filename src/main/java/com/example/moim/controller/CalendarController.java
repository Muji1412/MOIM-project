package com.example.moim.controller;

import com.example.moim.command.CalendarDTO;
import com.example.moim.entity.CalendarEntity;
import com.example.moim.entity.Groups;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.CalendarRepository;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.service.user.CustomUserDetails;
import com.example.moim.service.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarRepository calendarRepository;
    private final GroupsRepository groupsRepository;

    public CalendarController(CalendarRepository calendarRepository,
                              GroupsRepository groupsRepository) {
        this.calendarRepository = calendarRepository;
        this.groupsRepository = groupsRepository;
    }

    //달력 불러오기
    @PostMapping
    public List<CalendarDTO> getCalendar(@AuthenticationPrincipal CustomUserDetails user
                                         //, @RequestParam long groupNo
    ) {
        List<CalendarEntity> list = calendarRepository.getCalendarsByGroupNo(14);
        return list.stream().filter(cal -> !cal.isCalIsDeleted())
                .map(CalendarDTO::new).collect(Collectors.toList());
    }

    //일정 추가
    @PostMapping("/addEvent")
    public ResponseEntity<?> addEvent(@RequestBody CalendarDTO calendarDTO,
                                      @AuthenticationPrincipal CustomUserDetails user) {
        long groupNo = calendarDTO.getGroupNo();
        Groups group = groupsRepository.findByGroupNo(groupNo)
                .orElseThrow(() -> new IllegalArgumentException("그룹이 없습니다."));
        CalendarEntity cEntity = new CalendarEntity();
        cEntity.setUserNo(user.getUserNo());
        cEntity.setGroups(group);
        cEntity.setCalTitle(calendarDTO.getCalTitle());
        cEntity.setCalContent(calendarDTO.getCalContent());
        cEntity.setCalStart(calendarDTO.getCalStart());
        cEntity.setCalEnd(calendarDTO.getCalEnd());
        cEntity.setCalType(calendarDTO.getCalType());
        cEntity.setCalIsDone(calendarDTO.getCalIsDone());
        //System.out.println(cEntity.toString());
        try{
            CalendarEntity result = calendarRepository.save(cEntity);
        } catch(Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.ok("New Event Added!");
    }

    //일정 삭제
    @PostMapping("/deleteEvent")
    public ResponseEntity<?> deleteEvent(@RequestBody CalendarDTO calendarDTO) {

        long calNo = calendarDTO.getCalNo();
        CalendarEntity cEntity = calendarRepository.getCalendarByCalNo(calNo);
        cEntity.setCalIsDeleted(true);

        try{
            CalendarEntity result = calendarRepository.save(cEntity);
        } catch(Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.ok("Event Deleted");
    }

    //일정 수정
    @PostMapping("/modifyEvent")
    public ResponseEntity<?> modifyEvent(@RequestBody CalendarDTO calendarDTO) {
        long calNo = calendarDTO.getCalNo();
        CalendarEntity cEntity = calendarRepository.getCalendarByCalNo(calNo);
        cEntity.setCalContent((calendarDTO.getCalContent()));
        cEntity.setCalEnd(calendarDTO.getCalEnd());
        cEntity.setCalIsDone((calendarDTO.getCalIsDone()));

        try{
            CalendarEntity result = calendarRepository.save(cEntity);
        } catch(Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return ResponseEntity.ok("Event Modified");
    }

}
