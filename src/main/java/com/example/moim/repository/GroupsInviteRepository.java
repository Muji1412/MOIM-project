package com.example.moim.repository;

import com.example.moim.entity.GroupsInvite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupsInviteRepository extends JpaRepository<GroupsInvite, Long> {

    boolean existsByInviteCode(String inviteCode);

    GroupsInvite findGroupsInviteByInviteCode(String inviteCode);
}
