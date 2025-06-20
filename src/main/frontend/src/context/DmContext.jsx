// src/main/frontend/src/context/DmContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DmContext = createContext({
    dmRooms: [],
    activeDmRoom: null,
    dmMessages: [],
    selectDmRoom: () => {},
    sendMessage: () => {},
});

export const useDm = () => useContext(DmContext);

export const DmProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [dmRooms, setDmRooms] = useState([]);
    const [activeDmRoom, setActiveDmRoom] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            onConnect: () => console.log('Connected to WebSocket for DM'),
            onStompError: (frame) => console.error('Broker reported error: ' + frame.headers['message']),
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, []);

    useEffect(() => {
        if (currentUser) {
            console.log('=== currentUser 변경됨, DM 방 목록 조회 ===');
            console.log('currentUser:', currentUser);
            fetchDmRooms();
        } else {
            console.log('=== currentUser 없음, 상태 초기화 ===');
            setDmRooms([]);
            setActiveDmRoom(null);
        }
    }, [currentUser]);

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
                user: msg.senderNick, // DTO 구조에 맞게 수정
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
            console.log('응답 데이터 구조 확인:');
            console.log('- id:', response.data.id);
            console.log('- user1Nick:', response.data.user1Nick);
            console.log('- user2Nick:', response.data.user2Nick);

            setActiveDmRoom(response.data);

            if (!dmRooms.find(room => room.id === response.data.id)) {
                console.log('새로운 DM 방이므로 목록 새로고침');
                fetchDmRooms();
            } else {
                console.log('기존 DM 방이므로 목록 새로고침 생략');
            }
        } catch (error) {
            console.error('Failed to create or get DM room:', error);
            console.error('에러 상세:', error.response?.data);
            console.error('에러 상태:', error.response?.status);
        }
    };

    const sendMessage = (content) => {
        console.log('=== sendMessage 호출 ===');
        console.log('content:', content);
        console.log('stompClient 상태:', stompClient?.active);
        console.log('activeDmRoom:', activeDmRoom);
        console.log('currentUser:', currentUser);

        if (stompClient && activeDmRoom && content && currentUser) {
            const chatMessage = {
                channel: activeDmRoom.id.toString(),
                user: currentUser.userNick,
                text: content,
            };
            console.log('전송할 메시지:', chatMessage);

            stompClient.publish({
                destination: '/pub/dm',
                body: JSON.stringify(chatMessage),
            });
            console.log('메시지 전송 완료');
        } else {
            console.log('메시지 전송 조건 불만족:');
            console.log('- stompClient:', !!stompClient);
            console.log('- activeDmRoom:', !!activeDmRoom);
            console.log('- content:', !!content);
            console.log('- currentUser:', !!currentUser);
        }
    };

    const value = {
        dmRooms,
        activeDmRoom,
        dmMessages,
        selectDmRoom,
        sendMessage,
    };

    return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
};
