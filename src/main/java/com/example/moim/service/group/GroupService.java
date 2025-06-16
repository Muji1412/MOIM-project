package com.example.moim.service.group;

import com.example.moim.entity.Group;
import com.example.moim.repository.GroupRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;

    public Group createGroup(Group group) {
        group.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));
        return groupRepository.save(group);
    }

    public Group getGroup(Long groupNo) {
        return groupRepository.findById(groupNo)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public Group updateGroup(Long groupNo, Group updated) {
        Group group = getGroup(groupNo);
        group.setGroupName(updated.getGroupName());
        group.setGroupOwnerId(updated.getGroupOwnerId());
        return groupRepository.save(group);
    }

    public void deleteGroup(Long groupNo) {
        groupRepository.deleteById(groupNo);
    }
}

