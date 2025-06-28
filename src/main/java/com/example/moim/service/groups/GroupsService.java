package com.example.moim.service.groups;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import com.example.moim.entity.Groups;
import com.example.moim.entity.UserGroup;
import com.example.moim.entity.Users;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.UserGroupRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.util.UserGroupId;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupsService {

    private final GroupsRepository groupsRepository;
    private final UserGroupRepository userGroupRepository;
    private final UsersRepository usersRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    // 서버 생성 시 생성자를 UserGroup에도 추가
    @Transactional
    public Groups createGroup(Groups groups, String username) {
        groups.setGroupOwnerId(username);
        groups.setGroupCreatedAt(new Timestamp(System.currentTimeMillis()));

        // 1. 그룹 저장
        Groups savedGroup = groupsRepository.save(groups);

        // 2. 사용자들 조회
        Users owner = usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Users bot = usersRepository.findByUsername("MO-GPT")
                .orElseThrow(() -> new RuntimeException("Bot not found: MO-GPT"));

        // 봇용 객체도 생성
        UserGroupId ownerGroupId = new UserGroupId(savedGroup.getGroupNo(), owner.getUserNo());
        UserGroupId botGroupId = new UserGroupId(savedGroup.getGroupNo(), bot.getUserNo());

        // 둘 다 엔티티에 넣음
        UserGroup ownerGroup = UserGroup.builder()
                .id(ownerGroupId)
                .group(savedGroup)
                .user(owner)
                .build();

        UserGroup botToGroup = UserGroup.builder()
                .id(botGroupId)
                .group(savedGroup)
                .user(bot)
                .build();

        userGroupRepository.save(ownerGroup);
        userGroupRepository.save(botToGroup);


        return savedGroup;
    }

    // 봇 웰컴메세지 메서드
    public void sendWelcomeMessage(Groups group) {
        String welcomeText = """
# 🎊 MOIM에 오신걸 환영합니다! 🎊

### 🤖✨ 저는 MO-GPT입니다. 저를 @로 언급하시고 질문하시면 돼요! 💬

### 💡 **예시** - @MO-GPT 오늘 저녁밥은 어떤게 좋을까? 🍽️

## 🌟 MOIM은 마크다운을 지원해요!

💪 `**굵은 글씨**` → **굵은 글씨**

📝 `*기울임 글씨*` → *기울임 글씨*

📚 `# 제목1`, `## 제목2`, `### 제목3`
""";


        ChatMessage welcomeMessage = new ChatMessage();
        welcomeMessage.setUser("MO-GPT");
        welcomeMessage.setText(welcomeText);
        welcomeMessage.setUserImg("https://storage.googleapis.com/moim-bucket/74/6f9976d9-30a0-4f3c-b1c4-a0862e11434a.png");
        welcomeMessage.setChannel("일반채팅");
        welcomeMessage.setDate(java.time.LocalDateTime.now().toString());

        // 웰컴 메시지 전송
        messagingTemplate.convertAndSend("/topic/chat/" + group.getGroupName(), welcomeMessage);

        // 메시지 저장
        chatService.saveChat(group.getGroupName(), "일반채팅", welcomeMessage);
    }

    // 봇 웰컴이미지 메서드
    public void sendWelcomeImage(Groups group) {
        ChatMessage imageMessage = new ChatMessage();
        imageMessage.setUser("MO-GPT");
        imageMessage.setText(""); // 텍스트는 빈 문자열로
        imageMessage.setImageUrl("https://storage.googleapis.com/moim-bucket/12/f0fce8ae-a0d3-44cc-8c1a-0f16880b1dfb.png");
        imageMessage.setUserImg("https://storage.googleapis.com/moim-bucket/74/6f9976d9-30a0-4f3c-b1c4-a0862e11434a.png");
        imageMessage.setChannel("일반채팅");
        imageMessage.setDate(java.time.LocalDateTime.now().toString());

        // 이미지 메시지 전송
        messagingTemplate.convertAndSend("/topic/chat/" + group.getGroupName(), imageMessage);

        // 메시지 저장
        chatService.saveChat(group.getGroupName(), "일반채팅", imageMessage);
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
