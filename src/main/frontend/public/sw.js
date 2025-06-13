// 서비스 워커 설치 (install) 이벤트
// 서비스 워커가 처음 등록될 때 한 번만 실행됩니다.
self.addEventListener('install', (event) => {
    console.log('✅ 서비스 워커 설치 성공!');
    // 새로운 서비스 워커가 설치되면 즉시 활성화되도록 합니다.
    event.waitUntil(self.skipWaiting());
});

// 서비스 워커 활성화 (activate) 이벤트
// 설치 성공 후, 이전 버전의 서비스 워커가 제어하던 페이지가 모두 닫히면 실행됩니다.
self.addEventListener('activate', (event) => {
    console.log('✅ 서비스 워커 활성화 성공!');
    // 활성화 즉시 페이지 제어권을 가져옵니다.
    event.waitUntil(self.clients.claim());
});

// 푸시 알림 수신 (push) 이벤트
// 서버로부터 푸시 메시지를 받으면 실행됩니다.
self.addEventListener('push', (event) => {
    console.log('📨 푸시 메시지 수신:', event.data.text());

    // 푸시 메시지를 JSON 형식으로 파싱합니다.
    // 백엔드에서 new JSONObject().put("title", title).put("message", body) 형식으로 보냈으므로
    // 이 구조에 맞게 파싱합니다.
    const pushData = event.data.json();

    const title = pushData.title || '새로운 알림';
    const options = {
        body: pushData.message,
        icon: '/favicon.ico', // 알림에 표시될 아이콘
        badge: '/badge-icon.png' // 안드로이드에서 사용될 뱃지 아이콘 (선택사항)
    };

    // 브라우저에 알림을 표시합니다.
    event.waitUntil(self.registration.showNotification(title, options));
});