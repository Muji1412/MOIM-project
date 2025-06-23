// src/main/frontend/src/context/DmContext.jsx
import React, {createContext, useState, useContext, useEffect, useRef} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify'; // 추가

const DmContext = createContext({
    // 기존 DM 관련
    dmRooms: [],
    activeDmRoom: null,
    dmMessages: [],
    notifications: [],
    selectDmRoom: () => {},
    sendMessage: () => {},
    markNotificationAsRead: () => {},

    // 친구 관련 추가
    showAddFriend: false,
    openAddFriend: () => {},
    closeAddFriend: () => {},
});

export const useDm = () => useContext(DmContext);

export const DmProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [dmRooms, setDmRooms] = useState([]);
    const [activeDmRoom, setActiveDmRoom] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [notificationSubscription, setNotificationSubscription] = useState(null); // 추가
    const [notifications, setNotifications] = useState([]); // 추가
    const [showAddFriend, setShowAddFriend] = useState(false);

    // ⭐️ [추가된 로직 1] activeDmRoom의 최신 값을 담을 ref 생성
    const activeDmRoomRef = useRef(activeDmRoom); // [!code ++]

    // ⭐️ [추가된 로직 2] activeDmRoom 상태가 변경될 때마다 ref 값을 업데이트
    useEffect(() => { // [!code ++]
        activeDmRoomRef.current = activeDmRoom; // [!code ++]
    }, [activeDmRoom]); // [!code ++]

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            onConnect: (frame) => {
                console.log('Connected to WebSocket for DM');
                console.log('Connection frame:', frame);
                // ⭐️ 연결 완료 후 알림 구독 ⭐️
                if (currentUser) {
                    subscribeToNotifications(client);
                    //에러 구독
                    subscribeToErrors(client);
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Error frame:', frame);
            },
            onWebSocketError: (error) => {
                console.error('WebSocket error:', error);
            },
            onDisconnect: () => {
                console.log('STOMP 연결 해제됨');
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, []);

    // 친구 관련 함수 추가
    const openAddFriend = () => {
        console.log('친구 추가 페이지 열기');
        setShowAddFriend(true);
    };

    const closeAddFriend = () => {
        console.log('친구 목록 페이지로 돌아가기');
        setShowAddFriend(false);
    };

    const returnToFriendsList = () => {
        setActiveDmRoom(null);      // 활성화된 DM 채팅방을 닫습니다.
        setShowAddFriend(false);    // 친구 추가 페이지를 닫습니다.
    };

    // ⭐️ 알림 구독 함수 ⭐️
    const subscribeToNotifications = (client) => {
        if (!currentUser || !client || !client.connected) {
            console.log('구독 조건 불만족:', {
                currentUser: !!currentUser,
                client: !!client,
                connected: client?.connected
            });
            return;
        }

        console.log('=== 알림 구독 시작 ===');
        console.log('currentUser.username:', currentUser.username);

        // 기존 구독 해제
        if (notificationSubscription) {
            notificationSubscription.unsubscribe();
        }

        try {
            // ⭐️ 여러 구독 방식으로 테스트 ⭐️

            // 방법 1: 기본 구독
            const subscription1 = client.subscribe(
                `/sub/notification/${currentUser.username}`,
                (message) => {
                    console.log('=== 방법1 알림 수신 ===', message.body);
                    const notificationData = JSON.parse(message.body);
                    handleNewNotification(notificationData);
                }
            );

            // 방법 2: user prefix 사용 (Spring Boot 2.4+ 권장)
            const subscription2 = client.subscribe(
                `/user/queue/notification`,
                (message) => {
                    console.log('=== 방법2 알림 수신 ===', message.body);
                    const notificationData = JSON.parse(message.body);
                    handleNewNotification(notificationData);
                }
            );

            setNotificationSubscription(subscription1); // 기본 구독 사용
            console.log('✅ 알림 구독 성공!');

            // ⭐️ 구독 성공 확인을 위한 테스트 메시지 요청 ⭐️
            setTimeout(() => {
                client.publish('/pub/test-notification', {}, JSON.stringify({
                    username: currentUser.username,
                    message: '구독 테스트'
                }));
            }, 1000);

        } catch (error) {
            console.error('❌ 알림 구독 실패:', error);
        }
    };

    // ⭐️ 새 알림 처리 ⭐️
    const handleNewNotification = (notificationData) => {
        const currentActiveRoom = activeDmRoomRef.current;
        // ⭐️ [수정된 로직] state 대신 ref 값을 사용하여 현재 활성화된 채팅방의 알림인지 확인
        if (currentActiveRoom && currentActiveRoom.id === notificationData.roomId) {
            console.log(`현재 활성화된 방(${currentActiveRoom.id})의 메시지이므로 알림을 표시하지 않습니다.`);
            return; // 함수 종료
        }

        // 토스트 알림 표시
        toast.info(
            `${notificationData.senderNick}님이 메시지를 보냈습니다`,
            {
                onClick: () => {
                    // 알림 클릭 시 해당 DM방으로 이동
                    const targetRoom = dmRooms.find(room => room.id === notificationData.roomId);
                    if (targetRoom) {
                        setActiveDmRoom(targetRoom);
                    }
                    markNotificationAsRead(notificationData.id);
                },
                autoClose: 5000
            }
        );

        // 알림 목록에 추가
        setNotifications(prev => [{
            id: notificationData.id,
            type: 'DM',
            senderNick: notificationData.senderNick,
            message: notificationData.message,
            roomId: notificationData.roomId,
            timestamp: notificationData.sentAt,
            isRead: false
        }, ...prev]);

        // DM 방 목록 새로고침 (새 메시지 표시용)
        fetchDmRooms();
    };
    // const handleNewNotification = (notificationData) => {
    //     // 토스트 알림 표시
    //     toast.info(
    //         `${notificationData.senderNick}님이 메시지를 보냈습니다`,
    //         {
    //             onClick: () => {
    //                 // 알림 클릭 시 해당 DM방으로 이동
    //                 const targetRoom = dmRooms.find(room => room.id === notificationData.roomId);
    //                 if (targetRoom) {
    //                     setActiveDmRoom(targetRoom);
    //                 }
    //                 markNotificationAsRead(notificationData.id);
    //             },
    //             autoClose: 5000
    //         }
    //     );
    //
    //     // 알림 목록에 추가
    //     setNotifications(prev => [{
    //         id: notificationData.id,
    //         type: 'DM',
    //         senderNick: notificationData.senderNick,
    //         message: notificationData.message,
    //         roomId: notificationData.roomId,
    //         timestamp: notificationData.sentAt,
    //         isRead: false
    //     }, ...prev]);
    //
    //     // DM 방 목록 새로고침 (새 메시지 표시용)
    //     fetchDmRooms();
    // };

    // ⭐️ currentUser 변경 시 알림도 다시 구독 ⭐️
    useEffect(() => {
        if (currentUser) {
            console.log('=== currentUser 변경됨, DM 방 목록 조회 ===');
            console.log('currentUser:', currentUser);
            fetchDmRooms();

            // ⭐️ 웹소켓이 연결되어 있고 CONNECTED 상태일 때만 알림 구독 ⭐️
            if (stompClient?.active && stompClient.state === 'CONNECTED') {
                subscribeToNotifications(stompClient);
            }
        } else {
            console.log('=== currentUser 없음, 상태 초기화 ===');
            setDmRooms([]);
            setActiveDmRoom(null);
            setNotifications([]);

            // 알림 구독 해제
            if (notificationSubscription) {
                notificationSubscription.unsubscribe();
                setNotificationSubscription(null);
            }
        }
    }, [currentUser, stompClient?.state]);

    // ⭐️ 알림 읽음 처리 ⭐️
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif
            )
        );
    };

    // 기존 useEffect들은 그대로...
    useEffect(() => {
        if (activeDmRoom && stompClient?.active) {
            console.log('=== activeDmRoom 변경됨, 웹소켓 구독 ===');
            console.log('activeDmRoom:', activeDmRoom);

            if (subscription) {
                subscription.unsubscribe();
            }
            const newSubscription = stompClient.subscribe(`/sub/dm/room/${activeDmRoom.id}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                console.log('=== 웹소켓 메시지 수신 ===');
                console.log('receivedMessage:', receivedMessage);

                setDmMessages((prevMessages) => [...prevMessages, {
                    user: receivedMessage.user,
                    text: receivedMessage.text,
                    timestamp: receivedMessage.date || new Date().toISOString(),
                }]);
            });
            setSubscription(newSubscription);
            fetchMessages(activeDmRoom.id);
        }
        return () => {
            subscription?.unsubscribe();
        }
    }, [activeDmRoom, stompClient]);

    // 기존 함수들은 그대로...
    const fetchDmRooms = async () => {
        console.log('=== fetchDmRooms 호출 ===');
        const token = sessionStorage.getItem('accessToken');
        if (!token) {
            console.log('토큰이 없어서 DM 방 목록 조회 중단');
            return;
        }

        try {
            console.log('DM 방 목록 API 요청 시작');
            const response = await axios.get('/api/dm/rooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('DM 방 목록 API 응답:', response.data);
            setDmRooms(response.data);
        } catch (error) {
            console.error('Failed to fetch DM rooms:', error);
            console.error('에러 상세:', error.response?.data);
        }
    };

    // 나머지 함수들도 그대로...
    const fetchMessages = async (roomId) => {
        console.log('=== fetchMessages 호출 ===');
        console.log('roomId:', roomId);

        const token = sessionStorage.getItem('accessToken');
        if (!token) {
            console.log('토큰이 없어서 메시지 조회 중단');
            return;
        }

        try {
            console.log('메시지 목록 API 요청 시작');
            const response = await axios.get(`/api/dm/rooms/${roomId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('메시지 목록 API 응답:', response.data);

            const formattedMessages = response.data.map(msg => ({
                user: msg.senderNick,
                text: msg.message,
                timestamp: msg.sentAt
            }));
            console.log('포맷된 메시지:', formattedMessages);
            setDmMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            console.error('에러 상세:', error.response?.data);
            setDmMessages([]);
        }
    };

    const selectDmRoom = async (friend) => {
        console.log('=== selectDmRoom 호출 ===');
        console.log('전달받은 friend:', friend);
        console.log('currentUser:', currentUser);

        const token = sessionStorage.getItem('accessToken');
        if (!token) {
            console.log('토큰이 없어서 DM 방 선택 중단');
            return;
        }

        if (!friend || !friend.userNick) {
            console.error('friend 데이터가 올바르지 않음:', friend);
            return;
        }

        try {
            console.log('DM 방 생성/조회 API 요청 시작');
            console.log('요청 데이터:', { recipientNick: friend.userNick });

            const response = await axios.post('/api/dm/rooms',
                { recipientNick: friend.userNick },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log('DM 방 생성/조회 API 응답:', response.data);
            setActiveDmRoom(response.data);
            console.log(response.data)

            if (!dmRooms.find(room => room.id === response.data.id)) {
                console.log('새로운 DM 방이므로 목록 새로고침');
                fetchDmRooms();
            }
        } catch (error) {
            console.error('Failed to create or get DM room:', error);
        }
    };

    const sendMessage = (content) => {
        console.log('=== sendMessage 호출 ===');
        console.log('content:', content);

        if (stompClient && activeDmRoom && content && currentUser) {
            const chatMessage = {
                channel: activeDmRoom.id.toString(),
                user: currentUser.userNick,
                text: content,
                user1No: activeDmRoom.user1No,
                user2No: activeDmRoom.user2No
            };
            console.log('전송할 메시지:', chatMessage);

            stompClient.publish({
                destination: '/pub/dm',
                body: JSON.stringify(chatMessage),
            });
            console.log('메시지 전송 완료');

            fetchDmRooms();
        }
    };

    const subscribeToErrors = (client) => {
        if (!currentUser || !client || !client.connected) return;

        client.subscribe('/user/queue/errors', (error) => {
            const errorData = JSON.parse(error.body);
            console.log('WebSocket 에러 수신:', errorData);

            // 토스트 알림으로 사용자에게 알리기
            toast.error(errorData.message, {
                autoClose: 3000
            });

        });
    };

    const value = {
        // 기존 DM 관련
        dmRooms,
        activeDmRoom,
        dmMessages,
        notifications,
        selectDmRoom,
        sendMessage,
        markNotificationAsRead,

        // 친구 관련 추가
        showAddFriend,
        openAddFriend,
        closeAddFriend,

        // 친구창 띄워주는
        returnToFriendsList,

    };

    return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
};
