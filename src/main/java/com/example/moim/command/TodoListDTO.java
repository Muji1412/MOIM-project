package com.example.moim.command;

import java.sql.Timestamp;


public record TodoListDTO(long todoNo,
                          long userNo,
                          String todoTitle,
                          String todoContent,
                          Timestamp todoStart,
                          Timestamp todoEnd,
                          String todoIsDone) {
}
