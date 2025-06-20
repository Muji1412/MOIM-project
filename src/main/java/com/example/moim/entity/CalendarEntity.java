package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Entity
@Table(name = "calendar")
@Getter
@Setter
public class CalendarEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cal_no")
    private Long calNo; //일정번호

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_no")
    private Groups groups;//그룹번호

    @Column(name = "user_no")
    private long userNo; //유저번호

    @Column(name = "cal_title", nullable = false)
    private String calTitle; //일정타이틀

    @Column(name = "cal_content")
    private String calContent; //일정내용

    @Column(name = "cal_start")
    private Timestamp calStart; //일정시작시간

    @Column(name = "cal_end")
    private Timestamp calEnd; //일정마치는시간

    @Column(name = "cal_type")
    private String calType; //일정타입

    @Column(name = "cal_is_done")
    private String calIsDone; //일정완료여부

    @Column(name = "cal_is_deleted")
    private boolean calIsDeleted; //일정완료여부

}
