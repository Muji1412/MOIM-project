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

    // 서버 생성 시 소유자 정보 포함
    public Groups createGroup(Groups groups, String ownerId) {
        groups.setGroupOwnerId(ownerId);
        groups.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));
        return groupsRepository.save(groups);
    }

    // 기존 메서드 (임시 호환성 유지)
    public Groups createGroup(Groups groups) {
        groups.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));
        return groupsRepository.save(groups);
    }

    public Groups getGroup(Long groupNo) {
        return groupsRepository.findById(groupNo)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    // 모든 서버 조회 대신 사용자별 서버 조회
    public List<Groups> getUserGroups(String userId) {
        if (userId == null || userId.isEmpty()) {
            return List.of(); // 빈 리스트 반환
        }
        return groupsRepository.findByGroupOwnerId(userId);
    }

    // 전체 서버 조회 (관리자용 또는 테스트용)
    public List<Groups> getAllGroups() {
        return groupsRepository.findAll();
    }

    public Groups updateGroup(Long groupNo, Groups groups) {
        return groupsRepository.save(groups);
    }

    public void deleteGroup(Long groupNo) {
        groupsRepository.deleteById(groupNo);
    }

    // 서버 소유자 확인
    public boolean isOwner(Long groupNo, String userId) {
        Groups group = getGroup(groupNo);
        return group.getGroupOwnerId() != null && group.getGroupOwnerId().equals(userId);
    }
}
