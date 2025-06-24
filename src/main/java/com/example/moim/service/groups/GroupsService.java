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

        UserGroup savedOwnerGroup = userGroupRepository.save(ownerGroup);
        System.out.println("서버 생성자 멤버십 추가 완료: " + savedOwnerGroup); // 디버깅용

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

    public boolean isMember(Long groupNo, String username) {
        try {
            // username으로 사용자 정보 조회
            Users user = usersRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // UserGroupId 생성 (복합키)
            UserGroupId userGroupId = new UserGroupId(groupNo, user.getUserNo());

            // usergroup 테이블에서 멤버십 존재 여부 확인
            return userGroupRepository.existsById(userGroupId);
        } catch (Exception e) {
            return false;
        }
    }


    public boolean isOwner(Long groupNo, String username) {
        try {
            Groups group = getGroup(groupNo);
            return group.getGroupOwnerId() != null && group.getGroupOwnerId().equals(username);
        } catch (Exception e) {
            return false;
        }
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

    @Transactional
    public void leaveGroup(Long groupNo, String username) {
        System.out.println("=== 서버 나가기 시작 - GroupNo: " + groupNo + ", Username: " + username + " ===");

        // username으로 사용자 정보 조회
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        System.out.println("사용자 정보 조회 완료 - UserNo: " + user.getUserNo());
        // UserGroupId 생성 (복합키)
        UserGroupId userGroupId = new UserGroupId(groupNo, user.getUserNo());
        System.out.println("삭제할 UserGroupId - GroupNo: " + userGroupId.getGroupNo() + ", UserNo: " + userGroupId.getUserNo());
        // 삭제 전 존재 여부 확인
        boolean exists = userGroupRepository.existsById(userGroupId);
        System.out.println("삭제 전 멤버십 존재 여부: " + exists);

        // 해당 사용자의 멤버십만 삭제
        userGroupRepository.deleteById(userGroupId);
        System.out.println("멤버십 삭제 완료");

        // 삭제 후 확인
        boolean existsAfter = userGroupRepository.existsById(userGroupId);
        System.out.println("삭제 후 멤버십 존재 여부: " + existsAfter);
    }


    // 전체 서버 조회 (관리자용)
//    public List<Groups> getAllGroups() {
//        return groupsRepository.findAll();
//    }
}
