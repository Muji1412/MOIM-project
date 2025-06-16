package com.example.moim.service.notification;


import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.entity.PushSubscription;
import com.example.moim.entity.Users;
import com.example.moim.repository.PushSubscriptionRepository;
import com.example.moim.repository.UsersRepository;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor; // Lombok 사용
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
@Transactional
public class PushNotificationService {

    // ⭐️ 스프링이 WebPushConfig를 통해 생성한 PushService 빈을 주입받습니다.
    private final PushService pushService;
    private final PushSubscriptionRepository subscriptionRepository;
    private final UsersRepository usersRepository; // 유저 단일로 보내주기 위해서

    // 구독 정보 저장 로직 (이하 동일)
    public void subscribe(PushSubscriptionDto subscriptionDto, Users user) {
        // 엔드포인트가 중복되면 기존 것을 삭제하고 새로 저장합니다.
        subscriptionRepository.findByEndpoint(subscriptionDto.endpoint()).ifPresent(subscriptionRepository::delete);

        PushSubscription subscription = PushSubscription.builder()
                .endpoint(subscriptionDto.endpoint())
                .p256dh(subscriptionDto.keys().p256dh())
                .auth(subscriptionDto.keys().auth())
                .user(user) // ✅ 현재 로그인한 사용자 정보를 함께 저장합니다.
                .build();
        subscriptionRepository.save(subscription);
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