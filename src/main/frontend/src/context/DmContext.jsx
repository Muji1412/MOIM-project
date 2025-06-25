// src/main/frontend/src/context/DmContext.jsx
import React, {createContext, useState, useContext, useEffect, useRef} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

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
    returnToFriendsList: () => {},

    // ⭐️ 새로 추가: 알림에서 DM 열기
    openDmFromNotification: () => {},
});

export const useDm = () => useContext(DmContext);

export const DmProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [dmRooms, setDmRooms] = useState([]);
    const [activeDmRoom, setActiveDmRoom] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [notificationSubscription, setNotificationSubscription] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendRequestSubscription, setFriendRequestSubscription] = useState(null);
    const [mentionNotificationSubscription, setMentionNotificationSubscription] = useState(null);

    const activeDmRoomRef = useRef(activeDmRoom);

    useEffect(() => {
        activeDmRoomRef.current = activeDmRoom;
    }, [activeDmRoom]);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            onConnect: (frame) => {
                console.log('Connected to WebSocket for DM');
                console.log('Connection frame:', frame);
                if (currentUser) {
                    subscribeToNotifications(client);
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

    // ⭐️ 새로 추가: 알림에서 DM 열기 함수
    const openDmFromNotification = (friend) => {
        console.log('알림에서 DM 열기:', friend);

        // 1. 친구 페이지로 이동
        window.location.href = '/friends';

        // 2. 페이지 로드 후 DM 선택 (localStorage에 저장해서 페이지 로드 후 처리)
        localStorage.setItem('openDmAfterLoad', JSON.stringify(friend));
    };

    // ⭐️ 페이지 로드 시 localStorage 확인해서 DM 열기
    useEffect(() => {
        const openDmData = localStorage.getItem('openDmAfterLoad');
        if (openDmData && currentUser) {
            try {
                const friend = JSON.parse(openDmData);
                console.log('페이지 로드 후 DM 열기:', friend);

                // localStorage 클리어
                localStorage.removeItem('openDmAfterLoad');

                // 약간의 지연 후 DM 선택 (컴포넌트 렌더링 대기)
                setTimeout(() => {
                    selectDmRoom(friend);
                }, 500);
            } catch (error) {
                console.error('openDmAfterLoad 파싱 에러:', error);
                localStorage.removeItem('openDmAfterLoad');
            }
        }
    }, [currentUser]);

    // 친구 관련 함수들
    const openAddFriend = () => {
        console.log('친구 추가 페이지 열기');
        setShowAddFriend(true);
    };

    const closeAddFriend = () => {
        console.log('친구 목록 페이지로 돌아가기');
        setShowAddFriend(false);
    };

    const returnToFriendsList = () => {
        setActiveDmRoom(null);
        setShowAddFriend(false);
    };

    // toast 구독 알림 함수
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

        if (friendRequestSubscription) {
            friendRequestSubscription.unsubscribe();
        }

        if (mentionNotificationSubscription) {
            mentionNotificationSubscription.unsubscribe();
        }

        try {
            const subscription = client.subscribe(
                `/user/queue/notification`,
                (message) => {
                    console.log('=== 알림 수신 ===', message.body);
                    const notificationData = JSON.parse(message.body);
                    handleNewNotification(notificationData);
                }
            );

            const friendSubscription = client.subscribe(
                `/user/queue/friend-request`,
                (message) => {
                    console.log('=== 친구 요청 알림 수신 ===', message.body);
                    const friendData = JSON.parse(message.body);
                    handleFriendRequestNotification(friendData);
                }
            );

            const mentionSubscription = client.subscribe(
                `/user/queue/mention-notification`,
                (message) => {
                    console.log('=== 멘션 수신 ===', message.body);
                    const mentionNotificationData = JSON.parse(message.body);
                    handleMentionNotification(mentionNotificationData);
                }
            );

            setNotificationSubscription(subscription);
            setFriendRequestSubscription(friendSubscription);
            setMentionNotificationSubscription(mentionSubscription);
            console.log('✅ 알림 구독 성공!');

        } catch (error) {
            console.error('❌ 알림 구독 실패:', error);
        }
    };

    // DM 알림 처리 메서드 (⭐️ 수정된 부분)
    const handleNewNotification = (notificationData) => {
        const currentActiveRoom = activeDmRoomRef.current;
        if (currentActiveRoom && currentActiveRoom.id === notificationData.roomId) {
            console.log(`현재 활성화된 방(${currentActiveRoom.id})의 메시지이므로 알림을 표시하지 않습니다.`);
            return;
        }

        const NotificationToast = ({ notificationData, onToastClick }) => (
            <div
                onClick={onToastClick}
                style={{
                    cursor: 'pointer',
                    whiteSpace: 'pre-wrap'
                }}
            >
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                    {notificationData.senderNick}
                </span>
                <span style={{ fontWeight: 'normal' }}>
                    님의 메세지
                </span>
                <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '4px'
                }}>
                    {notificationData.message}
                </div>
            </div>
        );

        // ⭐️ 수정된 토스트 알림
        toast.info(
            <NotificationToast
                notificationData={notificationData}
                onToastClick={() => {
                    console.log('토스트 알람클릭');
                    console.log(notificationData);

                    const friend = {
                        userNick: notificationData.senderNick
                    };

                    console.log(friend);

                    // ⭐️ openDmFromNotification 함수 사용
                    openDmFromNotification(friend);
                    markNotificationAsRead(notificationData.id);
                }}
            />,
            {
                autoClose: 5000,
                closeOnClick: false
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

        // DM 방 목록 새로고침
        fetchDmRooms();
    };

    // 멘션 알림 처리 메서드
    const handleMentionNotification = (mentionNotificationData) => {
        const NotificationToast = ({ mentionNotificationData, onToastClick }) => (
            <div
                onClick={onToastClick}
                style={{
                    cursor: 'pointer',
                    whiteSpace: 'pre-wrap'
                }}
            >
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                    {mentionNotificationData.groupName}
                </span>
                <span style={{ fontWeight: 'normal' }}></span>
                <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '4px'
                }}>
                    {mentionNotificationData.message}
                </div>
            </div>
        );

        toast.info(
            <NotificationToast
                mentionNotificationData={mentionNotificationData}
                onToastClick={() => {
                    console.log('토스트 알람클릭');
                    console.log(mentionNotificationData);

                    window.dispatchEvent(new CustomEvent('serverSelect', {
                        detail: { serverId: mentionNotificationData.groupId }
                    }));
                }}
            />,
            {
                autoClose: 5000,
                closeOnClick: false
            }
        );
    };

    // 친구 요청 알림 처리
    const FriendRequestToast = ({ friendData, onToastClick }) => (
        <div
            onClick={onToastClick}
            style={{
                cursor: 'pointer',
                whiteSpace: 'pre-wrap'
            }}
        >
            <span style={{ fontWeight: 'bold', color: '#333' }}>
                {friendData.requesterUsername} 님이
            </span>
            <br />
            <span style={{ fontWeight: 'normal' }}>
                친구 요청을 보냈습니다
            </span>
        </div>
    );

    const handleFriendRequestNotification = (friendData) => {
        console.log('친구 요청 받음:', friendData);

        toast.info(
            <FriendRequestToast
                friendData={friendData}
                onToastClick={() => {
                    console.log('친구 요청 토스트 클릭');
                    openAddFriend();
                }}
            />,
            {
                autoClose: 20000,
                closeOnClick: false
            }
        );

        setNotifications(prev => [{
            senderNick: friendData.requesterUsername,
            message: '친구 요청'
        }, ...prev]);
    };

    // currentUser 변경 시 알림 구독
    useEffect(() => {
        if (currentUser) {
            console.log('=== currentUser 변경됨, DM 방 목록 조회 ===');
            console.log('currentUser:', currentUser);
            fetchDmRooms();

            if (stompClient?.active && stompClient.state === 'CONNECTED') {
                subscribeToNotifications(stompClient);
            }
        } else {
            console.log('=== currentUser 없음, 상태 초기화 ===');
            setDmRooms([]);
            setActiveDmRoom(null);
            setNotifications([]);

            if (notificationSubscription) {
                notificationSubscription.unsubscribe();
                setNotificationSubscription(null);
            }

            if (friendRequestSubscription) {
                friendRequestSubscription.unsubscribe();
                setFriendRequestSubscription(null);
            }
        }
    }, [currentUser, stompClient?.state]);

    // 알림 읽음 처리
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif
            )
        );
    };

    // activeDmRoom 변경 시 웹소켓 구독
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

                const getSenderImage = (username) => {
                    const currentActiveRoom = activeDmRoomRef.current;
                    if (!currentActiveRoom) return null;

                    if (currentActiveRoom.user1Nick === username) {
                        return currentActiveRoom.user1Img;
                    } else if (currentActiveRoom.user2Nick === username) {
                        return currentActiveRoom.user2Img;
                    }
                    return null;
                };

                setDmMessages((prevMessages) => [...prevMessages, {
                    user: receivedMessage.user,
                    text: receivedMessage.text,
                    timestamp: receivedMessage.date || new Date().toISOString(),
                    senderImg: receivedMessage.senderImg || getSenderImage(receivedMessage.user)
                }]);
            });
            setSubscription(newSubscription);
            fetchMessages(activeDmRoom.id);
        }
        return () => {
            subscription?.unsubscribe();
        }
    }, [activeDmRoom, stompClient]);

    // DM 방 목록 조회
    const fetchDmRooms = async () => {
        console.log('=== fetchDmRooms 호출 ===');

        try {
            console.log('DM 방 목록 API 요청 시작');
            const response = await axios.get('/api/dm/rooms');
            console.log('DM 방 목록 API 응답:', response.data);
            setDmRooms(response.data);
        } catch (error) {
            console.error('Failed to fetch DM rooms:', error);
            console.error('에러 상세:', error.response?.data);
        }
    };

    // 메시지 목록 조회
    const fetchMessages = async (roomId) => {
        console.log('=== fetchMessages 호출 ===');
        console.log('roomId:', roomId);

        try {
            console.log('메시지 목록 API 요청 시작');
            const response = await axios.get(`/api/dm/rooms/${roomId}/messages`);
            console.log('메시지 목록 API 응답:', response.data);

            const formattedMessages = response.data.map(msg => ({
                user: msg.senderNick,
                text: msg.message,
                timestamp: msg.sentAt,
                senderImg: msg.senderImg
            }));
            console.log('포맷된 메시지:', formattedMessages);
            setDmMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            console.error('에러 상세:', error.response?.data);
            setDmMessages([]);
        }
    };

    // DM 방 선택
    const selectDmRoom = async (friend) => {
        console.log('=== selectDmRoom 호출 ===');

        if (!friend || !friend.userNick) {
            console.error('friend 데이터가 올바르지 않음:', friend);
            return;
        }

        try {
            console.log('DM 방 생성/조회 API 요청 시작');
            console.log('요청 데이터:', { recipientNick: friend.userNick });

            const response = await axios.post('/api/dm/rooms',
                { recipientNick: friend.userNick }
            );

            console.log('DM 방 생성/조회 API 응답:', response.data);
            setActiveDmRoom(response.data);
            console.log(response.data);

            if (!dmRooms.find(room => room.id === response.data.id)) {
                console.log('새로운 DM 방이므로 목록 새로고침');
                fetchDmRooms();
            }
        } catch (error) {
            console.error('Failed to create or get DM room:', error);
        }
    };

    // 메시지 전송
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

    // 에러 구독
    const subscribeToErrors = (client) => {
        if (!currentUser || !client || !client.connected) return;

        client.subscribe('/user/queue/errors', (error) => {
            const errorData = JSON.parse(error.body);
            console.log('WebSocket 에러 수신:', errorData);

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

        // 친구 관련
        showAddFriend,
        openAddFriend,
        closeAddFriend,
        returnToFriendsList,

        // ⭐️ 새로 추가: 알림에서 DM 열기
        openDmFromNotification,
    };

    return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
};
