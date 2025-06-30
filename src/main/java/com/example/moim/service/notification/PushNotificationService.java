package com.example.moim.service.notification;


import com.example.moim.chatting.ChatMessage;
import com.example.moim.chatting.ChatService;
import com.example.moim.command.DirectMessageDTO;
import com.example.moim.command.FriendRequestDTO;
import com.example.moim.command.MentionNotificationDTO;
import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.entity.*;
import com.example.moim.repository.GroupsRepository;
import com.example.moim.repository.PushSubscriptionRepository;
import com.example.moim.repository.UsersRepository;
import com.example.moim.service.ai.AIService;
import jakarta.persistence.EntityNotFoundException;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor; // Lombok 사용
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
@Transactional
@Slf4j
public class PushNotificationService {

    // ⭐️ 스프링이 WebPushConfig를 통해 생성한 PushService 빈을 주입받습니다.
    private final PushService pushService;
    private final PushSubscriptionRepository subscriptionRepository;
    private final UsersRepository usersRepository; // 유저 단일로 보내주기 위해서
    private final SimpMessagingTemplate messagingTemplate;
    private final GroupsRepository groupsRepository;
    private final AIService aiService;
    private final ChatService chatService;


    // 구독 정보 저장 로직 (이하 동일)
    public void subscribe(PushSubscriptionDto subscriptionDto, Users user) {
        // ⭐️ [수정된 로직] ⭐️
        // 1. endpoint로 기존 구독 정보를 조회합니다.
        Optional<PushSubscription> existingSubscriptionOpt = subscriptionRepository.findByEndpoint(subscriptionDto.endpoint());

        if (existingSubscriptionOpt.isPresent()) {
            // 2. 구독 정보가 이미 존재하면, 기존 엔티티의 필드를 업데이트합니다.
            PushSubscription existingSubscription = existingSubscriptionOpt.get();
            existingSubscription.setP256dh(subscriptionDto.keys().p256dh());
            existingSubscription.setAuth(subscriptionDto.keys().auth());
            existingSubscription.setUser(user);
            subscriptionRepository.save(existingSubscription); // JPA가 변경을 감지하고 UPDATE 쿼리를 실행합니다.
        } else {
            // 3. 구독 정보가 없으면, 새로 생성합니다.
            PushSubscription newSubscription = PushSubscription.builder()
                    .endpoint(subscriptionDto.endpoint())
                    .p256dh(subscriptionDto.keys().p256dh())
                    .auth(subscriptionDto.keys().auth())
                    .user(user)
                    .build();
            subscriptionRepository.save(newSubscription); // INSERT 쿼리가 실행됩니다.
        }
    }

    // 알림 보내기 로직 (이하 동일)
    public void sendNotifications(String title, String body) {
        JSONObject payload = new JSONObject();
        payload.put("title", title);
        payload.put("message", body);

        var subscriptions = subscriptionRepository.findAll();

        for (PushSubscription sub : subscriptions) {
            try {
                Notification notification = new Notification(
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth(),
                        payload.toString()
                );
                pushService.send(notification);
            } catch (Exception e) {
                System.err.println("알림 전송 실패, 구독 정보 삭제: " + sub.getEndpoint());
                subscriptionRepository.delete(sub);
            }
        }
    }

    public void sendNotificationToUser(String username, String title, String body) {
        // 1. username으로 Users 엔티티를 찾습니다.
        usersRepository.findByUsername(username).ifPresent(user -> {
            // 2. 해당 User의 모든 구독 정보를 가져옵니다.
            List<PushSubscription> subscriptions = subscriptionRepository.findByUser(user);

            if (subscriptions.isEmpty()) {
                System.err.println("사용자 '" + username + "'의 푸시 구독 정보가 없습니다.");
                return;
            }

            System.out.println("'" + username + "'님에게 " + subscriptions.size() + "개의 구독에 알림을 보냅니다.");

            JSONObject payload = new JSONObject();
            payload.put("title", title);
            payload.put("message", body);

            // 3. 찾은 구독 정보들에 대해서만 알림을 보냅니다.
            for (PushSubscription sub : subscriptions) {
                try {
                    Notification notification = new Notification(
                            sub.getEndpoint(),
                            sub.getP256dh(),
                            sub.getAuth(),
                            payload.toString()
                    );
                    pushService.send(notification);
                } catch (Exception e) {
                    // 전송 실패 시 (만료 등) 해당 구독 정보를 삭제합니다.
                    System.err.println("알림 전송 실패, 구독 정보 삭제: " + sub.getEndpoint());
                    subscriptionRepository.delete(sub);
                }
            }
        });
    }

    public void sendDMNotification(DirectMessage savedMessage) {
        DirectMessageDTO messageDTO = new DirectMessageDTO(savedMessage);
        String recipientUserId = getRecipientUserId(savedMessage);


        if (recipientUserId != null) {

            // 방법 1: 기본 방식
//            messagingTemplate.convertAndSend("/sub/notification/" + recipientUserId, messageDTO);

            // 방법 2: 사용자별 방식 (Spring Boot 2.4+ 권장)
            System.out.println("dm노티 테스트 받는사람 아이디" + recipientUserId);
            messagingTemplate.convertAndSendToUser(recipientUserId, "/queue/notification", messageDTO);


            String title = savedMessage.getSender().getUserNick() + "님의 새 메시지"; //
            String body = savedMessage.getMessage(); //
            sendNotificationToUser(recipientUserId, title, body);
            System.out.println("DM 알림 전송 완료: " + recipientUserId);
        }
    }

    // 친구추가 신청 노티
    public void sendFriendRequestNotification(FriendRequestDTO requestDTO) {
        String recipientUserId = requestDTO.getReceiverUsername();

        
        // 유저 NO가 아니라 아이디를 넣어줘야함


        if (recipientUserId != null) {

            // 방법 2: 사용자별 방식 (Spring Boot 2.4+ 권장)
            messagingTemplate.convertAndSendToUser(recipientUserId, "/queue/friend-request", requestDTO);
            System.out.println("메세지템플릿 전송," + recipientUserId);
            System.out.println("메세지템플릿 전송," + requestDTO.getRequesterUsername());
        }
    }

    // 멘션 노티 메서드
    public void sendMentionNotification(String groupName, ChatMessage chatMessage){

        // n명에게 보낼수도 있으므로, 변경
        // 만약 에브리원이 들어왔다면 그룹의 전체인원에게 보내는 로직으로 변경

        List<String> mentioneded = mentionedList(chatMessage.getText());
//        System.out.println("멘션리스트 for문 전에" + mentioneded);
        Groups group = groupsRepository.getGroupsByGroupName(groupName); // 어차피 같은 서버이므로 for문 안에서 돌 필요 없음

//        String prompt = ("--- 프롬프트 시작 --- 너는 지금 채팅서비스에 봇 역할을 하고 있어. 기본적으로 한국에서 서비스되기때문에 한국어로 대답해야하지만 영어로 물어보거나 다른 나라 언어로 물어보는 경우에는 다른 언어로 응답해도 돼. 응답이 너무 길면 안돼. 300자 이상 넘어가는 답변은 피해가도록 해. --프롬프트 끝-- 유저의 쿼리 : ");
        String prompt = (
            """
            --- 프롬프트 시작 ---
            당신은 'MO-GPT'라는 이름의 채팅봇입니다. 지금 실시간 채팅방에서 다른 사용자들과 함께 대화하고 있습니다. 단순 api요청이기에 맥락을 이해하지 못합니다.
            
            **정체성 & 성격**:
            - 이름: MO-GPT
            - 성격: 친근하고 유머러스하며 도움이 되는 봇
            - 말투: 자연스러운 한국어, 이모지 적절히 사용, 마크다운 사용
            
            **채팅 환경 이해**:
            - 멘션(@MO-GPT)될 때만 응답
            - 채팅방의 다른 사용자들도 대화에 참여 중
            - 실시간 대화이므로 즉시 응답
            
            **응답 가이드라인**:
            • 길이: 300자 이내로 간결하게
            • 언어: 기본 한국어, 다른 언어 질문시 해당 언어로 응답
            • 톤: 채팅방 분위기에 맞춰 캐주얼하게
            • 스타일: 자연스러운 대화, 필요시 이모지 사용 😊
            
            **특별 기능**:
            - 질문 답변 및 정보 제공
            - 간단한 코딩 도움
            - 재미있는 대화 참여
            - 필요시 검색이나 계산 도움
            
            **주의사항**:
            - 불확실한 정보는 추측하지 않기
            - 부적절한 내용 정중히 거절
            - 채팅방 규칙 준수
            
            --- 프롬프트 끝 ---
            
            사용자 메시지:
            """);


        for (String name : mentioneded) {

            if ("MO-GPT".equals(name.trim())) {  // 안전한 비교 + trim
                String answer = aiService.getAnswer(prompt + chatMessage.getText());
//                System.out.println(answer);

                // 메세지 보내는 부분
                ChatMessage botMessage = new ChatMessage();
                botMessage.setUser("MO-GPT");
                botMessage.setText(answer);
//                botMessage.setImageUrl("이거는 메세지에 이미지 넣어야함.");
                botMessage.setUserImg("https://storage.googleapis.com/moim-bucket/74/6f9976d9-30a0-4f3c-b1c4-a0862e11434a.png");
                botMessage.setChannel(chatMessage.getChannel());
                botMessage.setDate(java.time.LocalDateTime.now().toString());
                log.info("셋채널 여기로 보냅니다." + chatMessage.getChannel());

                // 메세지 전송
                messagingTemplate.convertAndSend("/topic/chat/" + groupName, botMessage);

                // 세이브해서 저장함.
                chatService.saveChat(groupName, botMessage.getChannel(), botMessage);
            }
            System.out.println("메세지 보낼 사람" + name);
            Users users = usersRepository.findByUserNick(name)
                    .orElseThrow(() -> new EntityNotFoundException("해당하는 유저가 없습니다."));
            String recipientUserId = users.getUsername();

            // 보내줘야할거, 메세지의 정보, 어디서
            MentionNotificationDTO mentionNotificationDTO = new MentionNotificationDTO(
                    group.getGroupNo().toString(),
                    group.getGroupName(),
                    chatMessage.getText()
            );

            messagingTemplate.convertAndSendToUser(recipientUserId, "/queue/mention-notification", mentionNotificationDTO);
        }
    }

    // 언급 전처리 메서드
    // TODO 유틸메서드나 딴쪽으로 옮겨서 사용

    public List<String> mentionedList(String text) {
        List<String> result = new ArrayList<>();
        String[] parts = text.split("@");
        for (int i = 1; i < parts.length; i++) {
            String part = parts[i].split("\\s")[0].trim(); //트림을 해야지 사고가 안남
            if (!part.isEmpty()) {
                result.add(part);
            }
        }
        return result;
    }


    private String getRecipientUserId(DirectMessage message) {
        DirectMessageRoom room = message.getRoom();
        Users sender = message.getSender();

        // 방에 참여한 사람 중 발신자가 아닌 사람의 username 반환
        if (room.getUser1().getUserNo().equals(sender.getUserNo())) {
            return room.getUser2().getUsername(); // user2가 받는 사람
        } else {
            return room.getUser1().getUsername(); // user1이 받는 사람
        }
    }
}
    // 특정 사용자에게 알림 보내기
//    public void sendNotificationToUser(String username, String message) {
        // 1. DB에서 사용자의 구독 정보를 모두 가져온다.
        // List<PushSubscription> subscriptions = subscriptionRepository.findByUsername(username);

        // 2. 테스트용 임시 구독 정보 (실제로는 DB에서 가져와야 함)
        // PushSubscriptionDto sub = ... (DB에서 가져온 구독 정보)
        // Notification notification = new Notification(sub.endpoint(), sub.keys().p256dh(), sub.keys().auth(), message);

        // 3. 각 구독 정보에 대해 알림 발송
        // for (PushSubscription sub : subscriptions) {
        //     try {
        //         pushService.send(new Notification(sub.getEndpoint(), sub.getP256dhKey(), sub.getAuthKey(), message));
        //     } catch (Exception e) {
        //         // 에러 처리 (만료된 구독 정보 삭제 등)
        //         e.printStackTrace();
        //     }
        // }