import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import 'tldraw/tldraw.css';

const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8089'
    : 'https://moim.o-r.kr';

function Whiteboard() {
    // --- State Management ---
    const [whiteboardData, setWhiteboardData] = useState(null);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [autoJoin, setAutoJoin] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);

    // --- WebSocket & TLDraw Refs ---
    const stompClient = useRef(null);
    const editorRef = useRef(null);
    const store = useRef(createTLStore({ shapeUtils: defaultShapeUtils }));

    // --- VideoCall과 동일한 데이터 로딩 패턴 ---
    const getStoredData = useCallback(() => {
        try {
            const storedData = sessionStorage.getItem('whiteboardData');
            if (storedData) {
                const data = JSON.parse(storedData);
                console.log('저장된 화이트보드 데이터:', data);

                if (!whiteboardData || whiteboardData.roomId !== data.roomId) {
                    console.log(`roomId 변경 감지: ${whiteboardData?.roomId} -> ${data.roomId}. 상태를 업데이트합니다.`);
                    setWhiteboardData(data);

                    // 상태 초기화
                    if (stompClient.current) {
                        stompClient.current.disconnect();
                    }
                    setIsConnected(false);
                    setConnectedUsers([]);
                }
            } else {
                setShowJoinForm(true);
            }
        } catch (error) {
            console.error('데이터 로딩 오류:', error);
            setShowJoinForm(true);
        }
    }, [whiteboardData]);

    // --- Visibility Change Detection ---
    useEffect(() => {
        getStoredData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('화이트보드 창이 다시 활성화되었습니다. 데이터를 다시 확인합니다.');
                getStoredData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [getStoredData]);

    // --- Auto Join Logic ---
    useEffect(() => {
        if (whiteboardData) {
            setAutoJoin(true);
            setShowJoinForm(false);
        }
    }, [whiteboardData]);

    useEffect(() => {
        if (autoJoin && whiteboardData && !isConnected) {
            connectWebSocket();
            setAutoJoin(false);
        }
    }, [autoJoin, whiteboardData, isConnected]);

    // --- Cleanup on Unmount ---
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (stompClient.current && whiteboardData) {
                sendMessage({
                    type: 'user-leave',
                    roomId: whiteboardData.roomId,
                    userId: whiteboardData.userId || whiteboardData.userName,
                    userName: whiteboardData.userName
                });
                stompClient.current.disconnect();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (stompClient.current) {
                console.log('컴포넌트가 사라지면서 WebSocket 연결을 종료합니다.');
                stompClient.current.disconnect();
            }
        };
    }, [whiteboardData]);

    // --- WebSocket Connection ---
    const connectWebSocket = async () => {
        try {
            const socket = new SockJS(`${APPLICATION_SERVER_URL}/ws`);
            const client = Stomp.over(socket);

            client.connect({}, (frame) => {
                console.log('WebSocket 연결됨:', frame);
                stompClient.current = client;
                setIsConnected(true);

                // 화이트보드 룸 구독
                client.subscribe(`/sub/whiteboard/${whiteboardData.roomId}`, (message) => {
                    const data = JSON.parse(message.body);
                    handleWebSocketMessage(data);
                });

                // 입장 알림
                sendMessage({
                    type: 'user-join',
                    roomId: whiteboardData.roomId,
                    userId: whiteboardData.userId || whiteboardData.userName,
                    userName: whiteboardData.userName
                });

            }, (error) => {
                console.error('WebSocket 연결 실패:', error);
                if (!whiteboardData) {
                    setShowJoinForm(true);
                }
            });
        } catch (error) {
            console.error('화이트보드 연결 실패:', error);
            if (!whiteboardData) {
                setShowJoinForm(true);
            }
        }
    };

    // --- WebSocket Message Handler ---
    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'change':
                if (editorRef.current && message.userId !== (whiteboardData.userId || whiteboardData.userName)) {
                    try {
                        const snapshot = JSON.parse(message.data);
                        editorRef.current.store.loadSnapshot(snapshot);
                    } catch (error) {
                        console.error('변경사항 적용 실패:', error);
                    }
                }
                break;

            case 'user-join':
                setConnectedUsers(prev => {
                    if (!prev.find(user => user.userId === message.userId)) {
                        return [...prev, { userId: message.userId, userName: message.userName }];
                    }
                    return prev;
                });
                break;

            case 'user-leave':
                setConnectedUsers(prev => prev.filter(user => user.userId !== message.userId));
                break;
        }
    };

    // --- Send WebSocket Message ---
    const sendMessage = (message) => {
        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.send(`/pub/whiteboard/${whiteboardData.roomId}`, {}, JSON.stringify(message));
        }
    };

    // --- TLDraw Event Handlers ---
    const handleMount = (editor) => {
        editorRef.current = editor;
        console.log('TLDraw 에디터 마운트됨');

        // 변경사항 감지하여 WebSocket으로 전송
        let changeTimeout;
        editor.store.listen(() => {
            if (isConnected && whiteboardData) {
                clearTimeout(changeTimeout);
                changeTimeout = setTimeout(() => {
                    const snapshot = editor.store.getSnapshot();
                    sendMessage({
                        type: 'change',
                        roomId: whiteboardData.roomId,
                        userId: whiteboardData.userId || whiteboardData.userName,
                        userName: whiteboardData.userName,
                        data: JSON.stringify(snapshot)
                    });
                }, 100); // 100ms debounce
            }
        });
    };

    const leaveWhiteboard = () => {
        if (stompClient.current && whiteboardData) {
            sendMessage({
                type: 'user-leave',
                roomId: whiteboardData.roomId,
                userId: whiteboardData.userId || whiteboardData.userName,
                userName: whiteboardData.userName
            });
        }
        window.close();
    };

    // --- Render Logic ---
    if (!isConnected && (!whiteboardData || showJoinForm)) {
        return (
            <>
                <style>{joinFormStyles}</style>
                <div className="join-container">
                    <div className="join-form-wrapper">
                        <h1>MOIM 화이트보드</h1>
                        <p>화이트보드 세션에 참여하려면 메인 애플리케이션에서 접근해주세요.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{whiteboardStyles}</style>
            <div className="whiteboard-wrapper">
                <div className="main-content">
                    <Tldraw
                        store={store.current}
                        onMount={handleMount}
                        autoFocus
                    />
                </div>

                <div className="controls-bar">
                    <div className="connected-users">
                        <span>접속자: {connectedUsers.length}명</span>
                        {connectedUsers.map(user => (
                            <span key={user.userId} className="user-badge">
                                {user.userName}
                            </span>
                        ))}
                    </div>
                    <button onClick={leaveWhiteboard} className="control-btn leave">
                        나가기
                    </button>
                </div>
            </div>
        </>
    );
}

// --- CSS Styles ---
const joinFormStyles = `
    .join-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; font-family: sans-serif; }
    .join-form-wrapper { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; color: #333; }
    .join-form-wrapper h1 { margin-bottom: 24px; font-size: 28px; font-weight: 600; }
    .join-form-wrapper p { margin-top: 20px; color: #666; font-size: 14px; line-height: 1.5; }
`;

const whiteboardStyles = `
    .whiteboard-wrapper { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; background-color: #202124; color: #fff; }
    .main-content { flex-grow: 1; position: relative; }
    .controls-bar { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 16px; background-color: #2c2d30; }
    .connected-users { display: flex; align-items: center; gap: 8px; }
    .user-badge { background: rgba(138, 180, 248, 0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px; }
    .control-btn { background: #4a4a4a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s; }
    .control-btn.leave { background-color: #ea4335; }
    .control-btn:hover { opacity: 0.8; }
`;

export default Whiteboard;
