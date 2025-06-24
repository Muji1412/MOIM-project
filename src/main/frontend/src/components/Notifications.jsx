import React, { useState, useEffect } from 'react';

// VAPID 공개키를 Unit8Array로 변환하는 헬퍼 함수
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationSetup() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const VAPID_PUBLIC_KEY = "BDgnhdO6oZ0uD0vA9YlsOi_1FcMkxUUXOqbBQrscEctZGpvIszTkuQk99LR06fkQvejdwlbYvlDSoaEwvg91bwI"; //

    useEffect(() => {
        // 컴포넌트 마운트 시 구독 상태 확인 및 구독 시도
        const setupPushNotifications = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const swRegistration = await navigator.serviceWorker.ready;
                    const subscription = await swRegistration.pushManager.getSubscription();

                    if (subscription) {
                        console.log('이미 푸시 구독이 되어 있습니다.');
                        setIsSubscribed(true);
                    } else {
                        console.log('푸시 구독이 되어있지 않습니다. 구독을 시도합니다.');
                        // 페이지 로드 시 자동으로 구독을 시도하거나,
                        // 사용자 클릭 이벤트를 통해 아래 subscribeUser()를 호출할 수 있습니다.
                    }
                } catch (error) {
                    console.error('푸시 구독 상태 확인 중 오류:', error);
                }
            }
        };

        setupPushNotifications();
    }, []);

    // 사용자가 '알림 받기' 버튼을 클릭했을 때 호출될 함수
    const subscribeUser = async () => {
        try {
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('✅ 새로운 푸시 구독 성공:', subscription);


            // 구독 정보를 백엔드로 전송
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(subscription)
            });

            console.log('푸시 알림이 구독되었습니다!');
            setIsSubscribed(true);
        } catch (error) {
            // 사용자가 권한을 거부한 경우 등
            console.error('❌ 푸시 구독 실패:', error);
            console.log('푸시 알림 구독에 실패했습니다. 브라우저 설정을 확인해주세요.');
        }
    };

    // UI 부분은 실제 앱에서는 버튼 하나만 두거나, 자동으로 처리할 수 있습니다.
    // 여기서는 테스트를 위해 명시적인 버튼을 만듭니다.
    return (
        <div style={{ display: 'none' /* 실제 앱에서는 이 UI를 숨깁니다. */ }}>
            <button onClick={subscribeUser} disabled={isSubscribed}>
                {isSubscribed ? '푸시 알림 구독됨' : '푸시 알림 받기'}
            </button>
        </div>
    );
}