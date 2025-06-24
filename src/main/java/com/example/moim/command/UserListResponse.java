package com.example.moim.command;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    private String channelName;
    private List<String> users = new ArrayList<>();
    private int userCount;
    private long timestamp;

    // 편의 생성자
    public UserListResponse(String channelName, List<String> users) {
        this.channelName = channelName;
        this.users = users != null ? users : new ArrayList<>();
        this.userCount = this.users.size();
        this.timestamp = System.currentTimeMillis();
    }
}