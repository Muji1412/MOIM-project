package com.example.moim.service.notification;


import com.example.moim.command.PushSubscriptionDto;
import com.example.moim.entity.PushSubscription;
import com.example.moim.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor; // Lombok 사용
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
@Transactional
public class PushNotificationService {

    // ⭐️ 스프링이 WebPushConfig를 통해 생성한 PushService 빈을 주입받습니다.
    private final PushService pushService;
    private final PushSubscriptionRepository subscriptionRepository;

    // 구독 정보 저장 로직 (이하 동일)
    public void subscribe(PushSubscriptionDto subscriptionDto) {
        subscriptionRepository.findByEndpoint(subscriptionDto.endpoint()).ifPresent(subscriptionRepository::delete);

        PushSubscription subscription = PushSubscription.builder()
                .endpoint(subscriptionDto.endpoint())
                .p256dh(subscriptionDto.keys().p256dh())
                .auth(subscriptionDto.keys().auth())
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