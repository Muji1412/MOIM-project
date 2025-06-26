import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';

function Whiteboard() {
    // --- 간소화된 State Management ---
    const [whiteboardData, setWhiteboardData] = useState(null);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);

    // --- TLDraw Refs ---
    const editorRef = useRef(null);
    const store = useRef(createTLStore({ shapeUtils: defaultShapeUtils }));
    const whiteboardSubscription = useRef(null);
    const isUpdatingRef = useRef(false);

    // --- 누락된 함수들 추가 ---
    const mergeWithCurrentState = (newSnapshot) => {
        if (!editorRef.current) return;

        try {
            // 현재는 단순히 loadSnapshot 사용 (향후 병합 로직으로 개선 가능)
            loadSnapshot(editorRef.current.store, newSnapshot);
            console.log('상태 병합 완료!');
        } catch (error) {
            console.error('상태 병합 실패:', error);
        }
    };

    const detectChanges = (oldSnapshot, newSnapshot) => {
        try {
            const oldData = JSON.parse(oldSnapshot);
            const newData = JSON.parse(newSnapshot);

            const changes = {
                added: [],
                modified: [],
                deleted: []
            };

            const oldShapes = new Map();
            const newShapes = new Map();

            // 기존 도형들을 Map으로 변환
            if (oldData.store) {
                oldData.store.forEach(record => {
                    if (record.typeName === 'shape') {
                        oldShapes.set(record.id, record);
                    }
                });
            }

            // 새로운 도형들을 Map으로 변환
            if (newData.store) {
                newData.store.forEach(record => {
                    if (record.typeName === 'shape') {
                        newShapes.set(record.id, record);
                    }
                });
            }

            // 추가된 도형 찾기
            newShapes.forEach((shape, id) => {
                if (!oldShapes.has(id)) {
                    changes.added.push(shape);
                } else {
                    // 수정된 도형 찾기
                    const oldShape = oldShapes.get(id);
                    if (JSON.stringify(oldShape) !== JSON.stringify(shape)) {
                        changes.modified.push(shape);
                    }
                }
            });

            // 삭제된 도형 찾기
            oldShapes.forEach((shape, id) => {
                if (!newShapes.has(id)) {
                    changes.deleted.push(id);
                }
            });

            return changes;
        } catch (error) {
            console.error('변경사항 감지 실패:', error);
            return { added: [], modified: [], deleted: [] };
        }
    };

    // --- 데이터 로딩 ---
    const getStoredData = useCallback(() => {
        try {
            const storedData = sessionStorage.getItem('whiteboardData');
            if (storedData) {
                const data = JSON.parse(storedData);
                if (!whiteboardData || whiteboardData.roomId !== data.roomId) {
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

    // --- 자동 연결 ---
    useEffect(() => {
        getStoredData();
    }, [getStoredData]);

    useEffect(() => {
        if (whiteboardData && !isConnected) {
            createServerWebSocket();
        }
    }, [whiteboardData, isConnected]);

    // --- Cleanup ---
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (whiteboardData && window.whiteboardStompClient?.connected) {
                sendServerMessage({
                    type: 'user-leave',
                    groupId: whiteboardData.groupId,
                    userName: whiteboardData.userName
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (whiteboardSubscription.current) {
                whiteboardSubscription.current.unsubscribe();
            }
        };
    }, [whiteboardData]);

    // --- WebSocket 연결 ---
    const createServerWebSocket = async () => {
        try {
            window.whiteboardConnectionId = Date.now() + '.' + Math.random().toString(36).substr(2, 9);

            const SockJS = (await import('sockjs-client')).default;
            const { Stomp } = await import('@stomp/stompjs');

            const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:8089'
                : 'https://moim.o-r.kr';

            if (window.whiteboardStompClient) {
                window.whiteboardStompClient.disconnect();
            }

            const socket = new SockJS(`${APPLICATION_SERVER_URL}/ws`);
            const client = Stomp.over(() => socket);

            client.heartbeat.outgoing = 10000;
            client.heartbeat.incoming = 10000;
            client.reconnect_delay = 5000;

            client.connect({}, (frame) => {
                console.log('WebSocket 연결 성공');
                window.whiteboardStompClient = client;
                setIsConnected(true);

                whiteboardSubscription.current = client.subscribe(
                    `/sub/whiteboard/${whiteboardData.groupId}`,
                    (message) => {
                        const data = JSON.parse(message.body);
                        handleServerMessage(data);
                    }
                );

                // 입장 메시지
                setTimeout(() => {
                    sendServerMessage({
                        type: 'user-join',
                        groupId: whiteboardData.groupId,
                        userName: whiteboardData.userName
                    });
                    // 기존 화이트보드 상태 요청 추가
                    sendServerMessage({
                        type: 'request-current-state',
                        groupId: whiteboardData.groupId,
                        userName: whiteboardData.userName
                    });
                }, 1000);
            }, (error) => {
                console.error('WebSocket 연결 실패:', error);
                setTimeout(() => createServerWebSocket(), 5000);
            });
        } catch (error) {
            console.error('WebSocket 생성 실패:', error);
        }
    };

    // --- 메시지 전송 ---
    const sendServerMessage = (message) => {
        if (window.whiteboardStompClient?.connected) {
            try {
                const messageWithConnectionId = {
                    ...message,
                    connectionId: window.whiteboardConnectionId
                };
                window.whiteboardStompClient.send(
                    `/pub/whiteboard/${whiteboardData.groupId}`,
                    {},
                    JSON.stringify(messageWithConnectionId)
                );
            } catch (error) {
                console.error('메시지 전송 실패:', error);
            }
        }
    };

    // --- 개선된 메시지 핸들러 ---
    const handleServerMessage = (message) => {
        console.log('=== 메시지 수신 ===', message.type, 'from', message.userName);

        switch (message.type) {
            case 'drawing-update':
                // 다른 사용자의 완성된 그림만 받아서 적용
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    console.log('다른 사용자 그림 적용 중...');
                    try {
                        isUpdatingRef.current = true;
                        const snapshot = JSON.parse(message.data);
                        loadSnapshot(editorRef.current.store, snapshot);
                        console.log('그림 적용 완료!');

                        setTimeout(() => {
                            isUpdatingRef.current = false;
                        }, 100);
                    } catch (error) {
                        console.error('그림 동기화 실패:', error);
                        isUpdatingRef.current = false;
                    }
                }
                break;

            case 'current-state-response':
                // 서버에서 보낸 응답은 항상 처리
                if (editorRef.current && (message.connectionId === "server" || message.connectionId !== window.whiteboardConnectionId)) {
                    console.log('초기 상태 응답 처리 중...');
                    try {
                        isUpdatingRef.current = true;
                        const snapshot = JSON.parse(message.data);
                        loadSnapshot(editorRef.current.store, snapshot);
                        console.log('초기 상태 로딩 완료!');

                        setTimeout(() => {
                            isUpdatingRef.current = false;
                        }, 100);
                    } catch (error) {
                        console.error('초기 상태 로딩 실패:', error);
                        isUpdatingRef.current = false;
                    }
                }
                break;

            case 'user-join':
                console.log('사용자 입장:', message.userName);
                // 새 사용자에게 현재 상태 전송 (자신이 아닌 경우에만)
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    setTimeout(() => {
                        const currentSnapshot = editorRef.current.store.getSnapshot();
                        const snapshotString = JSON.stringify(currentSnapshot);

                        // 빈 상태가 아닌 경우에만 전송
                        if (snapshotString.length > 100) { // 기본 빈 스냅샷보다 큰 경우
                            console.log('새 사용자에게 현재 상태 전송:', snapshotString.length);
                            sendServerMessage({
                                type: 'current-state-broadcast',
                                groupId: whiteboardData.groupId,
                                userName: whiteboardData.userName,
                                data: snapshotString,
                                targetUser: message.userName
                            });
                        }
                    }, 1000); // 1초 후 전송
                }
                break;

            case 'user-leave':
                console.log('사용자 퇴장:', message.userName);
                break;

            case 'user-count':
                const userCount = parseInt(message.data) || 0;
                const users = [];
                for (let i = 0; i < userCount; i++) {
                    users.push({
                        userId: `user${i}`,
                        userName: `사용자${i + 1}`
                    });
                }
                setConnectedUsers(users);
                break;

            case 'incremental-update':
                // 증분 업데이트 처리
                if (editorRef.current && message.connectionId !== window.whiteboardConnectionId) {
                    console.log('증분 업데이트 적용 중...');
                    try {
                        isUpdatingRef.current = true;
                        // 현재는 단순 처리, 향후 실제 증분 업데이트 로직 구현
                        console.log('증분 업데이트 완료!');

                        setTimeout(() => {
                            isUpdatingRef.current = false;
                        }, 100);
                    } catch (error) {
                        console.error('증분 업데이트 실패:', error);
                        isUpdatingRef.current = false;
                    }
                }
                break;
        }
    };

    // --- 수정된 핸들러 (주기적 체크 방식) ---
    const handleMount = (editor) => {
        editorRef.current = editor;
        console.log('에디터 마운트 완료');

        let lastSnapshot = null;
        let checkInterval;
        let isInitialized = false;

        // 초기 상태 요청
        const requestInitialState = () => {
            if (window.whiteboardStompClient?.connected && whiteboardData) {
                sendServerMessage({
                    type: 'request-initial-state',
                    groupId: whiteboardData.groupId,
                    userName: whiteboardData.userName
                });
            }
        };

        // 주기적으로 변경사항 체크하는 방식으로 변경
        const startPeriodicCheck = () => {
            checkInterval = setInterval(() => {
                if (window.whiteboardStompClient?.connected && whiteboardData && !isUpdatingRef.current && isInitialized) {
                    try {
                        const currentSnapshot = JSON.stringify(editor.store.getSnapshot());

                        // 이전 스냅샷과 다르면 전송
                        if (lastSnapshot && lastSnapshot !== currentSnapshot) {
                            console.log('=== 변경사항 감지 - 자동 전송 ===');

                            // 전체 스냅샷 전송 (현재 방식 유지)
                            sendServerMessage({
                                type: 'drawing-update',
                                groupId: whiteboardData.groupId,
                                userName: whiteboardData.userName,
                                data: currentSnapshot
                            });
                            console.log('자동 전송 완료!');
                        }
                        lastSnapshot = currentSnapshot;
                    } catch (error) {
                        console.error('주기적 체크 실패:', error);
                    }
                }
            }, 300); // 2초마다 체크
        };

        // 초기화 시퀀스
        setTimeout(() => {
            requestInitialState();
            setTimeout(() => {
                isInitialized = true;
                console.log('주기적 변경사항 체크 시작');
                startPeriodicCheck(); // 주기적 체크 활성화
            }, 2000);
        }, 1000);

        return () => {
            console.log('주기적 체크 정리');
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    };

    // --- 수동 전송 함수 추가 ---
    const handleManualSend = () => {
        console.log('수동 전송 버튼 클릭');
        if (editorRef.current && window.whiteboardStompClient?.connected && whiteboardData) {
            try {
                const snapshot = editorRef.current.store.getSnapshot();
                console.log('수동 전송 - 스냅샷 크기:', JSON.stringify(snapshot).length);
                sendServerMessage({
                    type: 'drawing-update',
                    groupId: whiteboardData.groupId,
                    userName: whiteboardData.userName,
                    data: JSON.stringify(snapshot)
                });
                console.log('수동 전송 완료!');
            } catch (error) {
                console.error('수동 전송 실패:', error);
            }
        } else {
            console.log('수동 전송 조건 불만족:', {
                hasEditor: !!editorRef.current,
                connected: window.whiteboardStompClient?.connected,
                hasData: !!whiteboardData
            });
        }
    };

    const leaveWhiteboard = () => {
        if (whiteboardData) {
            sendServerMessage({
                type: 'user-leave',
                groupId: whiteboardData.groupId,
                userName: whiteboardData.userName
            });
        }
        window.close();
    };

    // --- Render ---
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
                    <p>그림을 그리면 2초 후 자동으로 공유됩니다</p>
                    <small>연결 ID: {window.whiteboardConnectionId}</small>
                </div>
                {/* 웹소켓 연결 상태 */}
                <div style={{
                    padding: '8px 16px',
                    background: isConnected ? '#d4edda' : '#f8d7da',
                    color: isConnected ? '#155724' : '#721c24',
                    fontSize: '14px',
                    textAlign: 'center',
                    borderBottom: '1px solid #333'
                }}>
                    {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
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
                        <span>서버 {whiteboardData.groupId} | 접속자: {connectedUsers.length}명</span>
                    </div>
                    <button
                        onClick={handleManualSend}
                        style={{
                            backgroundColor: '#34a853',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            marginRight: '8px',
                            cursor: 'pointer'
                        }}>
                        수동 전송
                    </button>
                    <button onClick={leaveWhiteboard} className="control-btn leave">
                        나가기
                    </button>
                </div>
            </div>
        </>
    );
}

// --- CSS (동일) ---
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
    .control-btn { background: #4a4a4a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s; }
    .control-btn.leave { background-color: #ea4335; }
    .control-btn:hover { opacity: 0.8; }
`;

export default Whiteboard;
