// src/context/ServerChatContext.js
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const ServerChatContext = createContext();

export const useServerChat = () => {
    const context = useContext(ServerChatContext);
    if (!context) {
        throw new Error('useServerChat must be used within ServerChatProvider');
    }
    return context;
};

export const ServerChatProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentServer, setCurrentServer] = useState(null);
    const stompClientRef = useRef(null);

    const connectToServer = async (serverInfo) => {
        console.log("서버 연결 시도:", serverInfo);

        // 기존 연결 해제
        if (stompClientRef.current) {
            console.log("기존 웹소켓 연결 해제");
            stompClientRef.current.deactivate();
            setIsConnected(false);
            window.globalStompClient = null;
        }

        if (!serverInfo) return;

        const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:8089'
            : 'https://moim.o-r.kr';

        const client = new Client({
            webSocketFactory: () => new SockJS(`${APPLICATION_SERVER_URL}/ws`),
            reconnectDelay: 5000
        });

        return new Promise((resolve, reject) => {
            client.onConnect = () => {
                console.log(`서버 ${serverInfo.name}에 웹소켓 연결됨`);
                setIsConnected(true);
                setCurrentServer(serverInfo);
                window.globalStompClient = client; // 기존 코드 호환성

                // 서버 채팅 토픽 구독
                client.subscribe(`/topic/chat/${serverInfo.name}`, (msg) => {
                    const payload = JSON.parse(msg.body);
                    console.log("새 메시지 수신:", payload);
                    window.dispatchEvent(new CustomEvent('newChatMessage', {
                        detail: payload
                    }));
                });

                resolve(client);
            };

            client.onStompError = (frame) => {
                console.error('서버 STOMP 연결 오류:', frame);
                setIsConnected(false);
                reject(frame);
            };

            client.onDisconnect = () => {
                console.log("웹소켓 연결 해제됨");
                setIsConnected(false);
                window.globalStompClient = null;
            };

            client.activate();
            stompClientRef.current = client;
        });
    };

    const sendMessage = (destination, message) => {
        if (stompClientRef.current && isConnected) {
            console.log("메시지 전송:", destination, message);
            stompClientRef.current.publish({
                destination,
                body: JSON.stringify(message)
            });
            return true;
        }
        console.error('서버 웹소켓이 연결되지 않았습니다.');
        return false;
    };

    // 컴포넌트 언마운트 시 연결 해제
    useEffect(() => {
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                window.globalStompClient = null;
            }
        };
    }, []);

    const value = {
        isConnected,
        currentServer,
        connectToServer,
        sendMessage,
        stompClient: stompClientRef.current
    };

    return (
        <ServerChatContext.Provider value={value}>
            {children}
        </ServerChatContext.Provider>
    );
};
