package com.example.moim.command;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CreateInviteRequest {
    private Long groupId;
    private int days;
}
