package com.example.moim.service.GroupsInvite;

import com.example.moim.entity.Groups;
import com.example.moim.entity.Users;

public interface GroupsInviteService {
    String createInviteLink (int days, Groups groups);
    void addUserToGroup (String inviteCode, Users users);

}
