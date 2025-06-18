package com.example.moim.command;

import com.example.moim.entity.CalendarEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CalendarDTO {
    long calNo;
    long userNo;
    String calTitle;
    String calContent;
    Timestamp calStart;
    Timestamp calEnd;
    String calType;
    String calIsDone;

    public CalendarDTO(CalendarEntity entity) {
        this.calNo = entity.getCalNo();
        this.userNo = entity.getUserNo();
        this.calTitle = entity.getCalTitle();
        this.calContent = entity.getCalContent();
        this.calStart = entity.getCalStart();
        this.calEnd = entity.getCalEnd();
        this.calType = entity.getCalType();
        this.calIsDone = entity.getCalIsDone();
    }
}
