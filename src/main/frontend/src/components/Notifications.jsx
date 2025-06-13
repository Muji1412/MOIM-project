import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ⭐️ VAPID 공개키를 변환하는 헬퍼 함수
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

function NotificationComponent({ userId }) {
    // --- 기존 상태 변수들 ---
    const [notifications, setNotifications] = useState([]);
    const [client, setClient] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const receivedNotifIds = new Set();

    // --- ⭐️ 푸시 알림 테스트용 상태 변수 추가 ---
    const [pushTitle, setPushTitle] = useState("테스트 제목");
    const [pushBody, setPushBody] = useState("이것은 백엔드에서 보낸 푸시 알림입니다!");
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);


    const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:8089'  // ⚠️ 포트 번호는 본인 백엔드 서버에 맞게 수정
        : 'https://moim.o-r.kr';

    // ⚠️ 중요: 백엔드의 application.properties에 있는 VAPID 공개키를 여기에 붙여넣으세요.
    const VAPID_PUBLIC_KEY = "BDgnhdO6oZ0uD0vA9YlsOi_1FcMkxUUXOqbBQrscEctZGpvIszTkuQk99LR06fkQvejdwlbYvlDSoaEwvg91bwI";


    // --- ⭐️ 푸시 알림 관련 로직 추가 ---

    // 푸시 구독 및 서버에 정보 전송
    const subscribeToPush = async () => {
        // 1. 알림 권한 확인 및 요청
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('알림 권한이 거부되었습니다.');
                return;
            }
        }

        try {
            // 2. 서비스 워커 등록 확인 및 구독
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log("✅ 푸시 구독 성공:", JSON.stringify(subscription));

            // 3. 구독 정보를 서버로 전송
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            alert("푸시 알림 구독이 완료되었습니다!");
            setIsPushSubscribed(true);

        } catch (error) {
            console.error("❌ 푸시 구독 실패:", error);
            alert("푸시 알림 구독에 실패했습니다. 콘솔을 확인해주세요.");
        }
    };

    // 백엔드로 테스트 알림 발송 요청
    const sendTestNotification = async () => {
        if (!pushTitle || !pushBody) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        console.log(`📨 백엔드로 푸시 알림 요청: 제목=${pushTitle}, 내용=${pushBody}`);
        try {
            await fetch('/api/send-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: pushTitle, body: pushBody })
            });
            alert("백엔드로 알림 발송 요청을 보냈습니다.");
        } catch (error) {
            console.error("❌ 알림 발송 요청 실패:", error);
            alert("알림 발송 요청에 실패했습니다. 콘솔을 확인해주세요.");
        }
    };

    // --- 기존 웹소켓 로직 (변경 없음) ---
    // (이하 기존 코드는 생략... 그대로 두시면 됩니다)
    // useEffect(() => { ... });

    return (
        <div style={{ display: 'flex', gap: '20px' }}>
            {/* 기존 웹소켓 알림 컴포넌트 */}
            <div className="notification-container" style={{ padding: '20px', border: '1px solid #ddd', width: '50%' }}>
                <h2>웹소켓 알림 목록 (사용자: {userId})</h2>
                {/* 기존의 웹소켓 관련 UI는 여기에... */}
            </div>

            {/* ⭐️ 푸시 알림 테스트용 컴포넌트 */}
            <div className="push-test-container" style={{ padding: '20px', border: '1px solid #28a745', width: '50%' }}>
                <h2>🚀 웹 푸시 알림 테스트</h2>
                <p>백그라운드에서도 동작하는 알림을 테스트합니다.</p>

                <div style={{ marginBottom: '20px' }}>
                    <button onClick={subscribeToPush} disabled={isPushSubscribed}>
                        {isPushSubscribed ? '✅ 푸시 구독 완료' : '🔔 푸시 알림 구독하기'}
                    </button>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                        브라우저에 알림을 받을 수 있도록 등록합니다. (최초 1회)
                    </p>
                </div>

                <hr />

                <div style={{ marginTop: '20px' }}>
                    <h3>백엔드에 알림 발송 요청하기</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="push-title" style={{ display: 'block' }}>제목:</label>
                        <input
                            id="push-title"
                            type="text"
                            value={pushTitle}
                            onChange={(e) => setPushTitle(e.target.value)}
                            style={{ width: '90%', padding: '8px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="push-body" style={{ display: 'block' }}>내용:</label>
                        <textarea
                            id="push-body"
                            value={pushBody}
                            onChange={(e) => setPushBody(e.target.value)}
                            rows="3"
                            style={{ width: '90%', padding: '8px' }}
                        />
                    </div>
                    <button onClick={sendTestNotification}>
                        📤 백엔드에 푸시 알림 요청
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationComponent;


// import React, { useState, useEffect } from 'react';
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
//
// function NotificationComponent({ userId }) {
//     const [notifications, setNotifications] = useState([]);
//     const [client, setClient] = useState(null);
//     const [permissionGranted, setPermissionGranted] = useState(false);
//     const receivedNotifIds = new Set();
//
//
//     const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
//         ? 'http://localhost:8089'  // 개발 환경
//         : 'https://moim.o-r.kr';
//
//     // 브라우저 알림 권한 요청하기
//     const requestNotificationPermission = async () => {
//         // 브라우저가 알림을 지원하는지 확인
//         if (!("Notification" in window)) {
//             alert("이 브라우저는 알림을 지원하지 않습니다");
//             return false;
//         }
//
//         // 이미 허용되어 있으면 true 반환
//         if (Notification.permission === "granted") {
//             setPermissionGranted(true);
//             return true;
//         }
//
//         // 권한 요청
//         try {
//             const permission = await Notification.requestPermission();
//             const granted = permission === "granted";
//             setPermissionGranted(granted);
//             return granted;
//         } catch (error) {
//             console.error("알림 권한 요청 실패:", error);
//             return false;
//         }
//     };
//
//     // 브라우저 알림 보내기
//     const showBrowserNotification = (title, message) => {
//         if (!permissionGranted) {
//             console.log("알림 권한이 없습니다");
//             return;
//         }
//
//         try {
//             const notification = new Notification(title, {
//                 body: message,
//                 icon: '/favicon.ico', // 알림 아이콘 (선택사항)
//                 tag: 'notification', // 같은 태그의 알림은 덮어씀
//             });
//
//             // 알림 클릭 시 브라우저 창으로 포커스
//             notification.onclick = () => {
//                 window.focus();
//                 notification.close();
//             };
//
//             // 3초 후 자동으로 닫기
//             setTimeout(() => {
//                 notification.close();
//             }, 3000);
//
//         } catch (error) {
//             console.error("알림 생성 실패:", error);
//         }
//     };
//
//     // 컴포넌트 마운트 시 권한 확인
//     useEffect(() => {
//         if ("Notification" in window) {
//             setPermissionGranted(Notification.permission === "granted");
//         }
//     }, []);
//
//     // 테스트용 알림 추가 함수
//     const addTestNotification = () => {
//         const testNotif = {
//             id: Date.now(),
//             title: "테스트 알림",
//             message: "이것은 테스트 알림입니다!",
//             timestamp: new Date().toISOString()
//         };
//         setNotifications(prev => [testNotif, ...prev]);
//
//         // 브라우저 알림도 같이 보내기
//         showBrowserNotification(testNotif.title, testNotif.message);
//     };
//
//     useEffect(() => {
//         if (!userId) {
//             console.log('❌ userId가 없습니다!');
//             return;
//         }
//
//         console.log('🔄 WebSocket 연결 시도 중... userId:', userId);
//
//         const stompClient = new Client({
//             webSocketFactory: () => new SockJS(`${APPLICATION_SERVER_URL}/ws`),
//             reconnectDelay: 5000,
//
//             onConnect: () => {
//                 console.log('✅ STOMP 연결 성공!');
//                 setClient(stompClient);
//
//                 const onMessageReceived = (message) => {
//                     console.log('📨 메시지 수신:', message.body);
//                     const newNotif = JSON.parse(message.body);
//
//                     if (receivedNotifIds.has(newNotif.id)) {
//                         console.log('이미 수신된 알림입니다 (ID:', newNotif.id, ')');
//                         return;
//                     }
//
//                     receivedNotifIds.add(newNotif.id);
//                     setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
//
//                     // 🆕 웹소켓으로 받은 알림을 브라우저 알림으로도 보내기
//                     showBrowserNotification(newNotif.title || "새 알림", newNotif.message);
//                 };
//
//                 stompClient.subscribe('/topic/all', onMessageReceived);
//                 stompClient.subscribe(`/user/queue/notify`, onMessageReceived);
//
//                 console.log('✅ 구독 설정 완료');
//             },
//
//             onStompError: (frame) => {
//                 console.error('❌ STOMP 에러:', frame.headers['message']);
//                 console.error('에러 상세:', frame.body);
//             },
//
//             onWebSocketError: (error) => {
//                 console.error('❌ WebSocket 에러:', error);
//             },
//
//             onDisconnect: () => {
//                 console.log('❌ WebSocket 연결 해제됨');
//                 setClient(null);
//             }
//         });
//
//         stompClient.activate();
//
//         return () => {
//             if (stompClient && stompClient.active) {
//                 console.log('🔄 STOMP 연결 해제 중...');
//                 stompClient.deactivate();
//             }
//         };
//     }, [userId, permissionGranted]); // permissionGranted도 의존성에 추가
//
//     return (
//         <div className="notification-container" style={{ padding: '20px', border: '1px solid #ddd' }}>
//             <h2>알림 목록 (사용자: {userId})</h2>
//
//             {/* 연결 상태 및 알림 권한 상태 표시 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <span style={{
//                     color: client && client.connected ? 'green' : 'red',
//                     fontWeight: 'bold'
//                 }}>
//                     {client && client.connected ? '🟢 연결됨' : '🔴 연결 안됨'}
//                 </span>
//                 <br />
//                 <span style={{
//                     color: permissionGranted ? 'green' : 'orange',
//                     fontWeight: 'bold'
//                 }}>
//                     {permissionGranted ? '🔔 알림 허용됨' : '🔕 알림 권한 없음'}
//                 </span>
//             </div>
//
//             {/* 권한 요청 버튼 */}
//             {!permissionGranted && (
//                 <button
//                     onClick={requestNotificationPermission}
//                     style={{
//                         marginBottom: '10px',
//                         backgroundColor: '#007bff',
//                         color: 'white',
//                         border: 'none',
//                         padding: '8px 12px',
//                         borderRadius: '4px',
//                         cursor: 'pointer'
//                     }}
//                 >
//                     브라우저 알림 허용하기
//                 </button>
//             )}
//
//             {/* 테스트 버튼 */}
//             <button onClick={addTestNotification} style={{ marginBottom: '20px' }}>
//                 테스트 알림 추가
//             </button>
//
//             {notifications.length === 0 ? (
//                 <p>표시할 알림이 없습니다.</p>
//             ) : (
//                 <ul className="notification-list">
//                     {notifications.map((notif, index) => (
//                         <li key={notif.id || `${notif.timestamp}-${index}`}
//                             style={{
//                                 border: '1px solid #ccc',
//                                 padding: '10px',
//                                 margin: '5px 0',
//                                 borderRadius: '4px'
//                             }}>
//                             <strong>{notif.title}</strong>
//                             <p>{notif.message}</p>
//                             <span className="timestamp" style={{ fontSize: '12px', color: '#666' }}>
//                                 {new Date(notif.timestamp).toLocaleString()}
//                             </span>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </div>
//     );
// }
//
// export default NotificationComponent;
