    import { useState, useEffect } from 'react';

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

    const VAPID_PUBLIC_KEY = "BDgnhdO6oZ0uD0vA9YlsOi_1FcMkxUUXOqbBQrscEctZGpvIszTkuQk99LR06fkQvejdwlbYvlDSoaEwvg91bwI"; //

    export const usePushNotifications = () => {
        const [isSubscribed, setIsSubscribed] = useState(false);
        const [subscriptionError, setSubscriptionError] = useState(null);

        useEffect(() => {
            const checkSubscription = async () => {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const swRegistration = await navigator.serviceWorker.ready;
                    const subscription = await swRegistration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                }
            };
            checkSubscription();
        }, []);

        const subscribeToPush = async () => {
            if (!('serviceWorker' in navigator && 'PushManager' in window)) {
                setSubscriptionError('푸시 알림이 지원되지 않는 브라우저입니다.');
                return;
            }

            try {
                const swRegistration = await navigator.serviceWorker.ready;
                const subscription = await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                const token = sessionStorage.getItem('accessToken');
                if (!token) {
                    alert('로그인이 필요합니다.');
                    return;
                }

                const response = await fetch('/api/subscribe', { //
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(subscription)
                });

                if (response.ok) {
                    alert('푸시 알림이 성공적으로 구독되었습니다!');
                    setIsSubscribed(true);
                    setSubscriptionError(null);
                } else {
                    throw new Error('서버에 구독 정보를 저장하지 못했습니다.');
                }
            } catch (error) {
                console.error('푸시 구독 실패:', error);
                setSubscriptionError('알림 권한이 거부되었거나 오류가 발생했습니다.');
                alert('푸시 알림 구독에 실패했습니다. 브라우저의 알림 권한을 확인해주세요.');
            }
        };

        return { subscribeToPush, isSubscribed, subscriptionError };
    };