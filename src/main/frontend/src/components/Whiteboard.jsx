import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';

function Whiteboard() {
    // --- State Management ---
    const [whiteboardData, setWhiteboardData] = useState(null);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [autoJoin, setAutoJoin] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);

    // --- TLDraw Refs ---
    const editorRef = useRef(null);
    const store = useRef(createTLStore({ shapeUtils: defaultShapeUtils }));
    const whiteboardSubscription = useRef(null);

    // --- 데이터 로딩 패턴 ---
    const getStoredData = useCallback(() => {
        try {
            const storedData = sessionStorage.getItem('whiteboardData');
            if (storedData) {
                const data = JSON.parse(storedData);
                console.log('저장된 화이트보드 데이터:', data);

                if (!whiteboardData || whiteboardData.roomId !== data.roomId) {
                    console.log(`서버 변경 감지: ${whiteboardData?.groupId} -> ${data.groupId}. 상태를 업데이트합니다.`);
                    setWhiteboardData(data);
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
            createServerWebSocket();
            setAutoJoin(false);
        }
    }, [autoJoin, whiteboardData, isConnected]);

    // --- Cleanup on Unmount ---
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (whiteboardData && window.whiteboardStompClient?.connected) {
                sendServerMessage({
                    type: 'user-leave',
                    roomId: whiteboardData.roomId,
                    groupId: whiteboardData.groupId,
                    userId: whiteboardData.userId || whiteboardData.userName,
                    userName: whiteboardData.userName
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (whiteboardData && window.whiteboardStompClient?.connected) {
                sendServerMessage({
                    type: 'user-leave',
                    roomId: whiteboardData.roomId,
                    groupId: whiteboardData.groupId,
                    userId: whiteboardData.userId || whiteboardData.userName,
                    userName: whiteboardData.userName
                });
            }
            if (whiteboardSubscription.current) {
                whiteboardSubscription.current.unsubscribe();
            }
        };
    }, [whiteboardData]);

    // --- 서버별 공유 WebSocket 연결 (수정됨) ---
    const createServerWebSocket = async () => {
        try {
            console.log('=== 서버 공유 화이트보드 WebSocket 연결 생성 ===');

            // 각 연결마다 고유 ID 생성
            window.whiteboardConnectionId = Date.now() + Math.random();
            console.log('연결 ID:', window.whiteboardConnectionId);
            console.log('서버 ID:', whiteboardData.groupId);

            const SockJS = (await import('sockjs-client')).default;
            const { Stomp } = await import('@stomp/stompjs');

            const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:8089'
                : 'https://moim.o-r.kr';

            // 기존 연결 정리
            if (window.whiteboardStompClient) {
                try {
                    window.whiteboardStompClient.disconnect();
                } catch (e) {
                    console.log('기존 연결 정리 중 오류 (무시 가능):', e);
                }
            }

            const socket = new SockJS(`${APPLICATION_SERVER_URL}/ws`);
            const client = Stomp.over(() => socket);

            client.heartbeat.outgoing = 20000;
            client.heartbeat.incoming = 0;
            client.reconnect_delay = 5000;

            client.connect({}, (frame) => {
                console.log('=== 서버 공유 WebSocket 연결 성공 ===', frame);
                console.log('연결된 서버:', whiteboardData.groupId);
                console.log('연결 ID:', window.whiteboardConnectionId);
                window.whiteboardStompClient = client;
                setIsConnected(true);

                // /sub 접두사로 구독 (WebSocketConfig에 맞춤)
                whiteboardSubscription.current = client.subscribe(
                    `/sub/whiteboard/${whiteboardData.groupId}`,
                    (message) => {
                        console.log('=== 구독 메시지 수신 ===', message);
                        const data = JSON.parse(message.body);
                        handleServerMessage(data);
                    },
                    (error) => {
                        console.error('=== 구독 실패 ===', error);
                    }
                );

                console.log('서버 화이트보드 구독 완료:', `/sub/whiteboard/${whiteboardData.groupId}`);
                console.log('구독 ID:', whiteboardSubscription.current.id);

                // 즉시 연결 테스트 메시지 전송
                setTimeout(() => {
                    console.log('=== 연결 테스트 메시지 전송 ===');
                    sendServerMessage({
                        type: 'connection-test',
                        groupId: whiteboardData.groupId,
                        userName: whiteboardData.userName,
                        data: '연결 테스트 메시지'
                    });
                }, 1000);

                // 서버 입장 메시지 전송
                setTimeout(() => {
                    sendServerMessage({
                        type: 'user-join',
                        roomId: whiteboardData.roomId,
                        groupId: whiteboardData.groupId,
                        userId: whiteboardData.userId || whiteboardData.userName,
                        userName: whiteboardData.userName
                    });
                }, 2000);

            }, (error) => {
                console.error('=== 서버 WebSocket 연결 실패 ===', error);
                setTimeout(() => {
                    console.log('5초 후 서버 재연결 시도...');
                    createServerWebSocket();
                }, 5000);
            });

        } catch (error) {
            console.error('서버 WebSocket 생성 실패:', error);
            setShowJoinForm(true);
        }
    };

    // --- 서버 메시지 전송 함수 (수정됨) ---
    const sendServerMessage = (message) => {
        if (window.whiteboardStompClient && window.whiteboardStompClient.connected) {
            try {
                // 모든 메시지에 연결 ID 추가
                const messageWithConnectionId = {
                    ...message,
                    connectionId: window.whiteboardConnectionId
                };

                console.log('=== 서버 메시지 전송 ===', messageWithConnectionId.type);
                console.log('연결 ID:', window.whiteboardConnectionId);
                console.log('서버:', whiteboardData.groupId);
                console.log('전송 목적지:', `/pub/whiteboard/${whiteboardData.groupId}`);

                // /pub 접두사로 전송 (WebSocketConfig에 맞춤)
                window.whiteboardStompClient.send(
                    `/pub/whiteboard/${whiteboardData.groupId}`,
                    {},
                    JSON.stringify(messageWithConnectionId)
                );
                console.log('서버 메시지 전송 성공:', messageWithConnectionId.type);
            } catch (error) {
                console.error('서버 메시지 전송 실패:', error);
            }
        } else {
            console.error('서버 WebSocket 연결이 없습니다.');
            console.log('연결 상태:', {
                exists: !!window.whiteboardStompClient,
                connected: window.whiteboardStompClient?.connected
            });
        }
    };

    // --- 서버 메시지 핸들러 (수정됨) ---
    const handleServerMessage = (message) => {
        console.log('=== 서버 공유 화이트보드 메시지 수신 ===');
        console.log('메시지 타입:', message.type);
        console.log('발신 연결 ID:', message.connectionId);
        console.log('현재 연결 ID:', window.whiteboardConnectionId);
        console.log('전체 메시지:', message);

        switch (message.type) {
            case 'connection-test':
                console.log('>>> 연결 테스트 메시지 수신 성공!');
                alert('실시간 연결 테스트 성공! 서버: ' + message.groupId);
                break;

            case 'echo-test':
                console.log('>>> 에코 테스트 성공! 서버 응답:', message.data);
                alert('실시간 연결 테스트 성공: ' + message.data);
                break;

            case 'change':
                // 연결 ID 필터링으로 자신의 변경사항은 무시
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    try {
                        console.log('다른 연결의 변경사항 적용:', message.userName);
                        const snapshot = JSON.parse(message.data);
                        editorRef.current.store.loadSnapshot(snapshot);
                        console.log('서버 화이트보드 동기화 완료');
                    } catch (error) {
                        console.error('서버 화이트보드 동기화 실패:', error);
                    }
                } else {
                    console.log('자신의 연결이므로 무시');
                }
                break;

            case 'current-state':
                // 서버에서 보내는 현재 상태는 항상 적용
                if (editorRef.current && message.connectionId === 'server-state') {
                    try {
                        console.log('서버의 현재 화이트보드 상태 로드 중...');
                        const snapshot = JSON.parse(message.data);
                        editorRef.current.store.loadSnapshot(snapshot);
                        console.log('서버 화이트보드 상태 로드 완료');
                    } catch (error) {
                        console.error('서버 화이트보드 상태 로드 실패:', error);
                    }
                }
                break;

            case 'user-join':
                console.log('서버에 새 사용자 입장:', message.userName);
                break;

            case 'user-leave':
                console.log('서버에서 사용자 퇴장:', message.userName);
                break;

            case 'user-count':
                const userCount = parseInt(message.data) || 0;
                console.log('서버 접속자 수 업데이트:', userCount + '명');

                // 서버 접속자 수 표시
                const serverUsers = [];
                for (let i = 0; i < userCount; i++) {
                    serverUsers.push({
                        userId: `server-user${i}`,
                        userName: `서버 사용자${i + 1}`
                    });
                }
                setConnectedUsers(serverUsers);
                break;

            default:
                console.log('알 수 없는 서버 메시지 타입:', message.type);
                break;
        }
    };

    // --- TLDraw Event Handlers (수정됨) ---
    const handleMount = (editor) => {
        editorRef.current = editor;
        console.log('=== 서버 공유 TLDraw 에디터 마운트 ===');
        console.log('서버:', whiteboardData.groupId);
        console.log('연결 ID:', window.whiteboardConnectionId);

        // 변경사항 감지 패턴
        let changeTimeout;
        let isUpdating = false;

        editor.store.listen(() => {
            if (isConnected && whiteboardData && !isUpdating) {
                clearTimeout(changeTimeout);
                changeTimeout = setTimeout(() => {
                    try {
                        const snapshot = editor.store.getSnapshot();
                        const snapshotString = JSON.stringify(snapshot);

                        console.log('=== 서버 공유 화이트보드 변경사항 전송 ===');
                        console.log('연결 ID:', window.whiteboardConnectionId);
                        console.log('서버:', whiteboardData.groupId);
                        console.log('스냅샷 크기:', snapshotString.length);

                        sendServerMessage({
                            type: 'change',
                            roomId: whiteboardData.roomId,
                            groupId: whiteboardData.groupId,
                            userId: whiteboardData.userId || whiteboardData.userName,
                            userName: whiteboardData.userName,
                            data: snapshotString
                        });
                    } catch (error) {
                        console.error('서버 화이트보드 스냅샷 생성 실패:', error);
                    }
                }, 100);
            }
        });
    };

    const leaveWhiteboard = () => {
        if (whiteboardData) {
            sendServerMessage({
                type: 'user-leave',
                roomId: whiteboardData.roomId,
                groupId: whiteboardData.groupId,
                userId: whiteboardData.userId || whiteboardData.userName,
                userName: whiteboardData.userName
            });
        }
        window.close();
    };

    // 디버깅용 로그
    useEffect(() => {
        console.log('현재 서버 화이트보드 접속자 수:', connectedUsers.length, connectedUsers);
        console.log('현재 연결 ID:', window.whiteboardConnectionId);
        console.log('WebSocket 연결 상태:', window.whiteboardStompClient?.connected);
    }, [connectedUsers]);

    // --- Render Logic ---
    if (!isConnected && (!whiteboardData || showJoinForm)) {
        return (
            <>
                <style>{joinFormStyles}</style>
                <div className="join-container">
                    <div className="join-form-wrapper">
                        <h1>MOIM 서버 공유 화이트보드</h1>
                        <p>서버별 공유 화이트보드에 참여하려면 메인 애플리케이션에서 서버를 선택한 후 접근해주세요.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{whiteboardStyles}</style>
            <div className="whiteboard-wrapper">
                {/* 서버 정보 표시 */}
                <div className="server-info">
                    <h3>서버 {whiteboardData.groupId} 공유 화이트보드</h3>
                    <p>이 서버의 모든 사용자가 실시간으로 공유하는 화이트보드입니다</p>
                    <small>연결 ID: {window.whiteboardConnectionId}</small>
                    <div style={{marginTop: '8px'}}>
                        <button
                            onClick={() => sendServerMessage({
                                type: 'connection-test',
                                groupId: whiteboardData.groupId,
                                userName: whiteboardData.userName,
                                data: '수동 연결 테스트'
                            })}
                            style={{
                                background: '#4285f4',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            연결 테스트
                        </button>
                    </div>
                </div>

                <div className="main-content">
                    <Tldraw
                        store={store.current}
                        onMount={handleMount}
                        autoFocus
                    />
                </div>

                <div className="controls-bar">
                    <div className="connected-users">
                        <span>서버 {whiteboardData.groupId} 접속자: {connectedUsers.length}명</span>
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
    .server-info { background-color: #1a1a1a; padding: 12px 16px; border-bottom: 1px solid #333; text-align: center; }
    .server-info h3 { margin: 0 0 4px 0; font-size: 16px; color: #4285f4; }
    .server-info p { margin: 0; font-size: 12px; color: #aaa; }
    .server-info small { display: block; margin-top: 4px; font-size: 10px; color: #666; }
    .main-content { flex-grow: 1; position: relative; }
    .controls-bar { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 16px; background-color: #2c2d30; }
    .connected-users { display: flex; align-items: center; gap: 8px; }
    .user-badge { background: rgba(138, 180, 248, 0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px; }
    .control-btn { background: #4a4a4a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s; }
    .control-btn.leave { background-color: #ea4335; }
    .control-btn:hover { opacity: 0.8; }
`;

export default Whiteboard;
