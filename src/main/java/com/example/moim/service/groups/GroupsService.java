package com.example.moim.service.groups;

import com.example.moim.entity.Groups;
import com.example.moim.entity.UserGroup;
import com.example.moim.entity.Users;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.UserGroupRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.util.UserGroupId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupsService {

    private final GroupsRepository groupsRepository;
    private final UserGroupRepository userGroupRepository;
    private final UsersRepository usersRepository;

    // 서버 생성 시 생성자를 UserGroup에도 추가
    @Transactional
    public Groups createGroup(Groups groups, String username) {
        groups.setGroupOwnerId(username);
        groups.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));

        // 1. 그룹 저장
        Groups savedGroup = groupsRepository.save(groups);

        // 2. 생성자를 UserGroup 테이블에 추가
        Users owner = usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        UserGroup ownerGroup = UserGroup.builder()
                .id(new UserGroupId(savedGroup.getGroupNo(), owner.getUserNo()))
                .group(savedGroup)
                .user(owner)
                .build();

        userGroupRepository.save(ownerGroup);

        return savedGroup;
    }

    // 사용자별 서버 조회 (간단한 방법)
    public List<Groups> getUserGroups(String username) {
        if (username == null || username.isEmpty()) {
            return List.of();
        }

        // 1. 사용자 정보 조회
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // 2. 사용자가 속한 그룹 번호들 조회
        List<Long> groupNos = userGroupRepository.findGroupNosByUserNo(user.getUserNo());

        // 3. 그룹 번호들로 실제 그룹 정보 조회
        return groupsRepository.findAllById(groupNos);
    }



    // 서버 멤버 조회 (추가된 메서드)
    public List<Users> getGroupMembers(Long groupNo) {
        return userGroupRepository.findUsersByGroupNo(groupNo);
    }

    // 기존 메서드들...
    public Groups getGroup(Long groupNo) {
        return groupsRepository.findById(groupNo)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public boolean isOwner(Long groupNo, String username) {
        Groups group = getGroup(groupNo);
        return group.getGroupOwnerId() != null && group.getGroupOwnerId().equals(username);
    }

    public Groups updateGroup(Long groupNo, Groups groups) {
        return groupsRepository.save(groups);
    }

    @Transactional
    public void deleteGroup(Long groupNo) {
        // UserGroup 관계 먼저 삭제 (간단한 방법)
        List<Users> members = userGroupRepository.findUsersByGroupNo(groupNo);
        for (Users member : members) {
            UserGroupId userGroupId = new UserGroupId(groupNo, member.getUserNo());
            userGroupRepository.deleteById(userGroupId);
        }

        // 그룹 삭제
        groupsRepository.deleteById(groupNo);
    }

    // 전체 서버 조회 (관리자용)
//    public List<Groups> getAllGroups() {
//        return groupsRepository.findAll();
//    }
}
