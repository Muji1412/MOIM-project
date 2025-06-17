package com.example.moim.service.GroupsInvite;

import com.example.moim.entity.Groups;
import com.example.moim.entity.GroupsInvite;
import com.example.moim.entity.UserGroup;
import com.example.moim.entity.Users;
import com.example.moim.repository.GroupsInviteRepository;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.UserGroupRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.util.InviteCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupsInviteServiceImpl implements GroupsInviteService{

    private final GroupsInviteRepository groupsInviteRepository;
    private final GroupsRepository groupsRepository;
    private final UsersRepository usersRepository;
    private final UserGroupRepository userGroupRepository;

    // 초대링크 생성 및 DB에 주입
    @Override
    public String createInviteLink(int days, Groups groups) {
        // UUID 초대코드 생성 - 10자리
        String inviteCode = InviteCodeGenerator.generateSecureInviteCode(10);

        // 시간제한 Timestamp 생성, days 에 따라 값 유동적으로 변경
        Timestamp timeLimit = new Timestamp(System.currentTimeMillis() + (long) days * 24 * 60 * 60 * 1000);

        // 사실 throw보다는 재시도 로직을 시도하는게 더 좋음, 하지만 이정도 서비스에서 UUID 중복 가능성 매우 낮으므로 그냥 시도
        if (groupsInviteRepository.existsByInviteCode(inviteCode)) {throw new RuntimeException("일시적 오류입니다. 다시 시도해주세요.");}


        GroupsInvite groupsInvite = GroupsInvite.builder()
                .group(groups)
                .inviteCode(inviteCode)
                .timeLimit(timeLimit)
                .build();

        groupsInviteRepository.save(groupsInvite);

        return inviteCode;
    }

    // 초대링크 입력 시 사용자 그룹에 추가
    @Override
    @Transactional
    public void addUserToGroup(String inviteCode, Users users) {
        GroupsInvite groupsInvite = groupsInviteRepository.findGroupsInviteByInviteCode(inviteCode);
        // 시간 초과된지 아닌지 조회
        if (!groupsInvite.getTimeLimit().after(new Timestamp(System.currentTimeMillis()))) {
            throw new RuntimeException("만료된 초대입니다");
        }

        // 통과시 값 추가
        Groups groups = groupsInvite.getGroup();
        userGroupRepository.save(new UserGroup(groups.getGroupNo(), users.getUserNo()));

    }

}
