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
    const [activeUsers, setActiveUsers] = useState(new Map());
    const [isStateRestored, setIsStateRestored] = useState(false);
    const [hasReceivedInitialState, setHasReceivedInitialState] = useState(false);

    // --- TLDraw Refs ---
    const editorRef = useRef(null);
    const store = useRef(createTLStore({ shapeUtils: defaultShapeUtils }));
    const whiteboardSubscription = useRef(null);
    const isUpdatingRef = useRef(false);

    // --- 사용자별 고유 색상 생성 ---
    const getUserColor = useCallback((userId) => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#FF8A80', '#82B1FF', '#B9F6CA', '#FFD180'
        ];
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }, []);

    // --- 데이터 로딩 패턴 (수정됨) ---
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
                    setActiveUsers(new Map());
                    // setIsStateRestored(false); // 이 줄 제거 - 상태 복원 상태 유지
                    setHasReceivedInitialState(false); // 초기 상태 수신 여부만 초기화
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

    // --- 활성 사용자 정리 ---
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setActiveUsers(prev => {
                const updated = new Map();
                prev.forEach((user, userId) => {
                    if (now - user.lastSeen < 30000) {
                        updated.set(userId, user);
                    } else {
                        if (editorRef.current) {
                            const presenceId = `presence:${userId}`;
                            editorRef.current.store.mergeRemoteChanges(() => {
                                editorRef.current.store.remove([presenceId]);
                            });
                        }
                    }
                });
                return updated;
            });
        }, 5000);

        return () => clearInterval(cleanupInterval);
    }, []);

    // --- 상태 복원 타이머 (수정됨) ---
    useEffect(() => {
        if (isConnected && editorRef.current && !hasReceivedInitialState) {
            // 연결 후 1초 대기 후 초기 상태 수신 완료로 설정 (수정됨)
            const timer = setTimeout(() => {
                console.log('초기 상태 수신 타이머 완료 - 실시간 동기화 활성화');
                setHasReceivedInitialState(true);
                setIsStateRestored(true);
            }, 1000); // 3000 → 1000으로 단축

            return () => clearTimeout(timer);
        }
    }, [isConnected, hasReceivedInitialState]);

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

    // --- 서버별 공유 WebSocket 연결 ---
    const createServerWebSocket = async () => {
        try {
            console.log('=== 서버 공유 화이트보드 WebSocket 연결 생성 ===');

            window.whiteboardConnectionId = Date.now() + '.' + Math.random().toString(36).substr(2, 9);
            console.log('연결 ID:', window.whiteboardConnectionId);
            console.log('서버 ID:', whiteboardData.groupId);

            const SockJS = (await import('sockjs-client')).default;
            const { Stomp } = await import('@stomp/stompjs');

            const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:8089'
                : `http://${window.location.hostname}:8089`;

            console.log('WebSocket 서버 URL:', APPLICATION_SERVER_URL);

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

                // 연결 테스트 메시지 전송
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

    // --- 서버 메시지 전송 함수 ---
    const sendServerMessage = (message) => {
        if (window.whiteboardStompClient && window.whiteboardStompClient.connected) {
            try {
                const messageWithConnectionId = {
                    ...message,
                    connectionId: window.whiteboardConnectionId
                };

                console.log('=== 서버 메시지 전송 ===', messageWithConnectionId.type);
                console.log('연결 ID:', window.whiteboardConnectionId);
                console.log('서버:', whiteboardData.groupId);

                if (messageWithConnectionId.type === 'change') {
                    console.log('데이터 크기:', messageWithConnectionId.data ? messageWithConnectionId.data.length : 0);
                    console.log('Assets 크기:', messageWithConnectionId.assets ? messageWithConnectionId.assets.length : 0);
                }

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
        }
    };

    // --- 상태 복원 전용 핸들러 (수정됨) ---
    const handleStateRestoration = (message) => {
        console.log('=== 화이트보드 상태 복원 시작 ===');
        console.log('메시지 타입:', message.type);

        if (!editorRef.current) {
            console.error('에디터가 준비되지 않음');
            return;
        }

        try {
            isUpdatingRef.current = true;

            if (message.type === 'current-state') {
                console.log('>>> 기존 화이트보드 상태 복원 중...');
                console.log('>>> 상태 데이터 크기:', message.data ? message.data.length : 0);
                console.log('>>> Assets 크기:', message.assets ? message.assets.length : 0);

                // Assets 먼저 로드
                if (message.assets) {
                    const assets = JSON.parse(message.assets);
                    console.log('>>> Assets 복원 중:', Object.keys(assets).length, '개');

                    Object.values(assets).forEach(asset => {
                        editorRef.current.store.put([asset]);
                    });
                }

                // 화이트보드 상태 복원
                const snapshot = JSON.parse(message.data);
                editorRef.current.store.loadSnapshot(snapshot);

                console.log('>>> 화이트보드 상태 복원 완료');
                setHasReceivedInitialState(true);
                setIsStateRestored(true);

            } else if (message.type === 'empty-state') {
                console.log('>>> 새 화이트보드 - 빈 상태로 시작');
                setHasReceivedInitialState(true);
                setIsStateRestored(true);
            }

            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 1000);

        } catch (error) {
            console.error('화이트보드 상태 복원 실패:', error);
            isUpdatingRef.current = false;
        }
    };

    // --- 서버 메시지 핸들러 ---
    const handleServerMessage = (message) => {
        console.log('=== 서버 공유 화이트보드 메시지 수신 ===');
        console.log('메시지 타입:', message.type);
        console.log('발신 연결 ID:', message.connectionId);
        console.log('현재 연결 ID:', window.whiteboardConnectionId);

        switch (message.type) {
            case 'connection-test':
                console.log('>>> 연결 테스트 메시지 수신 성공!');
                break;

            case 'echo-test':
                console.log('>>> 에코 테스트 성공! 서버 응답:', message.data);
                break;

            case 'change':
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    try {
                        console.log('>>> 다른 연결의 변경사항 적용:', message.userName);
                        console.log('>>> 데이터 크기:', message.data ? message.data.length : 0);
                        console.log('>>> Assets 크기:', message.assets ? message.assets.length : 0);

                        isUpdatingRef.current = true;

                        if (message.assets) {
                            const assets = JSON.parse(message.assets);
                            console.log('>>> Assets 적용 중:', Object.keys(assets).length, '개');

                            Object.values(assets).forEach(asset => {
                                editorRef.current.store.put([asset]);
                            });
                        }

                        const snapshot = JSON.parse(message.data);
                        editorRef.current.store.loadSnapshot(snapshot);
                        console.log('>>> 서버 화이트보드 동기화 완료 (assets 포함)');

                        setTimeout(() => {
                            isUpdatingRef.current = false;
                        }, 500);
                    } catch (error) {
                        console.error('서버 화이트보드 동기화 실패:', error);
                        isUpdatingRef.current = false;
                    }
                } else {
                    console.log('>>> 자신의 연결이므로 무시');
                }
                break;

            case 'cursor-move':
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    try {
                        console.log('>>> 다른 사용자 커서 업데이트:', message.userName, '(연결 ID:', message.connectionId + ')');
                        const cursorData = JSON.parse(message.data);

                        const uniqueUserId = `${message.userId}_${message.connectionId}`;
                        const displayName = `${message.userName} (${message.connectionId.slice(-6)})`;

                        setActiveUsers(prev => {
                            const updated = new Map(prev);
                            updated.set(uniqueUserId, {
                                userName: displayName,
                                lastSeen: Date.now(),
                                color: getUserColor(uniqueUserId),
                                connectionId: message.connectionId
                            });
                            return updated;
                        });

                        const presenceId = `presence:${uniqueUserId}`;
                        const userColor = getUserColor(uniqueUserId);

                        const presenceRecord = {
                            id: presenceId,
                            typeName: 'instance_presence',
                            userId: uniqueUserId,
                            userName: displayName,
                            currentPageId: editorRef.current.getCurrentPageId(),
                            cursor: {
                                x: cursorData.x,
                                y: cursorData.y,
                                type: cursorData.type || 'default',
                                rotation: cursorData.rotation || 0
                            },
                            lastActivityTimestamp: cursorData.timestamp,
                            followingUserId: null,
                            chatMessage: '',
                            color: userColor
                        };

                        editorRef.current.store.mergeRemoteChanges(() => {
                            editorRef.current.store.put([presenceRecord]);
                        });

                        console.log('>>> 커서 위치 업데이트 완료 (고유 ID:', uniqueUserId + ')');
                    } catch (error) {
                        console.error('커서 위치 업데이트 실패:', error);
                    }
                } else {
                    console.log('>>> 자신의 연결이므로 커서 무시');
                }
                break;

            case 'current-state':
            case 'empty-state':
                // 상태 복원 처리
                if (message.connectionId === 'server-state') {
                    handleStateRestoration(message);
                }
                break;

            case 'user-join':
                console.log('>>> 서버에 새 사용자 입장:', message.userName);
                break;

            case 'user-leave':
                console.log('>>> 서버에서 사용자 퇴장:', message.userName);
                if (editorRef.current) {
                    const uniqueUserId = `${message.userId}_${message.connectionId}`;
                    const presenceId = `presence:${uniqueUserId}`;
                    editorRef.current.store.mergeRemoteChanges(() => {
                        editorRef.current.store.remove([presenceId]);
                    });
                    console.log('>>> 사용자 presence 제거:', message.userName, '(연결 ID:', message.connectionId + ')');
                }

                setActiveUsers(prev => {
                    const updated = new Map(prev);
                    for (const [userId, user] of prev.entries()) {
                        if (user.connectionId === message.connectionId) {
                            updated.delete(userId);
                        }
                    }
                    return updated;
                });
                break;

            case 'user-count':
                const userCount = parseInt(message.data) || 0;
                console.log('>>> 서버 접속자 수 업데이트:', userCount + '명');

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
                console.log('>>> 알 수 없는 서버 메시지 타입:', message.type);
                break;
        }
    };

    // --- TLDraw Event Handlers (수정됨) ---
    const handleMount = (editor) => {
        editorRef.current = editor;
        console.log('=== 서버 공유 TLDraw 에디터 마운트 ===');
        console.log('서버:', whiteboardData.groupId);
        console.log('연결 ID:', window.whiteboardConnectionId);

        let changeTimeout;
        let cursorTimeout;

        const handleStoreChange = () => {
            const isWebSocketConnected = window.whiteboardStompClient?.connected;
            const hasWhiteboardData = !!whiteboardData;
            const isCurrentlyUpdating = isUpdatingRef.current;

            console.log('>>> 스토어 변경 감지:', {
                isConnected: isWebSocketConnected,
                hasData: hasWhiteboardData,
                isUpdating: isCurrentlyUpdating,
                hasReceivedInitialState: hasReceivedInitialState
            });

            // 조건 완화: hasReceivedInitialState 조건 제거 (수정됨)
            if (isWebSocketConnected && hasWhiteboardData && !isCurrentlyUpdating) {
                clearTimeout(changeTimeout);
                changeTimeout = setTimeout(() => {
                    try {
                        const snapshot = editor.store.getSnapshot();
                        const snapshotString = JSON.stringify(snapshot);

                        const assets = {};
                        Object.keys(snapshot.store).forEach(key => {
                            const record = snapshot.store[key];
                            if (record.typeName === 'asset') {
                                assets[key] = record;
                            }
                        });

                        console.log('=== 서버 공유 화이트보드 변경사항 전송 (assets 포함) ===');
                        console.log('연결 ID:', window.whiteboardConnectionId);
                        console.log('서버:', whiteboardData.groupId);
                        console.log('스냅샷 크기:', snapshotString.length);
                        console.log('asset 수:', Object.keys(assets).length);

                        sendServerMessage({
                            type: 'change',
                            roomId: whiteboardData.roomId,
                            groupId: whiteboardData.groupId,
                            userId: whiteboardData.userId || whiteboardData.userName,
                            userName: whiteboardData.userName,
                            data: snapshotString,
                            assets: Object.keys(assets).length > 0 ? JSON.stringify(assets) : null
                        });
                    } catch (error) {
                        console.error('서버 화이트보드 스냅샷 생성 실패:', error);
                    }
                }, 50); // 100 → 50으로 단축
            }
        };

        const handlePointerMove = (info) => {
            const isWebSocketConnected = window.whiteboardStompClient?.connected;
            if (isWebSocketConnected && whiteboardData && !isUpdatingRef.current) {
                clearTimeout(cursorTimeout);
                cursorTimeout = setTimeout(() => {
                    const { x, y } = info.point;

                    sendServerMessage({
                        type: 'cursor-move',
                        roomId: whiteboardData.roomId,
                        groupId: whiteboardData.groupId,
                        userId: whiteboardData.userId || whiteboardData.userName,
                        userName: whiteboardData.userName,
                        data: JSON.stringify({
                            x: x,
                            y: y,
                            type: 'default',
                            rotation: 0,
                            timestamp: Date.now()
                        })
                    });
                }, 50);
            }
        };

        const unsubscribeStore = editor.store.listen(handleStoreChange);
        const unsubscribePointer = editor.on('pointer-move', handlePointerMove);

        return () => {
            unsubscribeStore();
            unsubscribePointer();
            clearTimeout(changeTimeout);
            clearTimeout(cursorTimeout);
        };
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
        console.log('현재 활성 사용자 수:', activeUsers.size, Array.from(activeUsers.entries()));
        console.log('현재 연결 ID:', window.whiteboardConnectionId);
        console.log('WebSocket 연결 상태:', window.whiteboardStompClient?.connected);
        console.log('업데이트 상태:', isUpdatingRef.current);
        console.log('상태 복원 완료:', isStateRestored);
        console.log('초기 상태 수신 완료:', hasReceivedInitialState);
    }, [connectedUsers, activeUsers, isStateRestored, hasReceivedInitialState]);

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
                <div className="server-info">
                    <h3>서버 {whiteboardData.groupId} 공유 화이트보드</h3>
                    <p>이 서버의 모든 사용자가 실시간으로 공유하는 화이트보드입니다</p>
                    <small>연결 ID: {window.whiteboardConnectionId} | 초기 상태: {hasReceivedInitialState ? '수신완료' : '대기중'}</small>
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
                                cursor: 'pointer',
                                marginRight: '8px'
                            }}
                        >
                            연결 테스트
                        </button>
                        <button
                            onClick={() => {
                                console.log('=== 수동 상태 요청 ===');
                                sendServerMessage({
                                    type: 'request-current-state',
                                    roomId: whiteboardData.roomId,
                                    groupId: whiteboardData.groupId,
                                    userId: whiteboardData.userId || whiteboardData.userName,
                                    userName: whiteboardData.userName
                                });
                            }}
                            style={{
                                background: '#34a853',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            상태 복원
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
                        <span>서버 {whiteboardData.groupId} 접속자: {activeUsers.size}명</span>
                        {Array.from(activeUsers.entries()).map(([userId, user]) => (
                            <span
                                key={userId}
                                className="user-badge"
                                style={{
                                    backgroundColor: user.color + '20',
                                    borderLeft: `3px solid ${user.color}`,
                                    position: 'relative'
                                }}
                            >
                                <span
                                    className="user-indicator"
                                    style={{
                                        backgroundColor: user.color,
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }}
                                ></span>
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
    .connected-users { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .user-badge { background: rgba(138, 180, 248, 0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px; display: flex; align-items: center; }
    .user-indicator { width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .control-btn { background: #4a4a4a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s; }
    .control-btn.leave { background-color: #ea4335; }
    .control-btn:hover { opacity: 0.8; }
`;

export default Whiteboard;
