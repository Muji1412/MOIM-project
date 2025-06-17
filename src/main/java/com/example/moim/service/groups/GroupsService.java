package com.example.moim.service.groups;

import com.example.moim.entity.Groups;
import com.example.moim.repository.GroupsRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupsService {
    private final GroupsRepository groupsRepository;

    public Groups createGroup(Groups groups) {
        groups.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));
        return groupsRepository.save(groups);
    }

    public Groups getGroup(Long groupNo) {
        return groupsRepository.findById(groupNo)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public List<Groups> getAllGroups() {
        return groupsRepository.findAll();
    }

    public Groups updateGroup(Long groupNo, Groups updated) {
        Groups groups = getGroup(groupNo);
        groups.setGroupName(updated.getGroupName());
        groups.setGroupOwnerId(updated.getGroupOwnerId());
        return groupsRepository.save(groups);
    }

    public void deleteGroup(Long groupNo) {
        groupsRepository.deleteById(groupNo);
    }
}

