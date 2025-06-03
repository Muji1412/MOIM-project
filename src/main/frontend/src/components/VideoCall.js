import React, { useState, useEffect, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';

function VideoCall() {

    // 컴포넌트 최상위에 추가 (다른 useEffect들과 함께)


    // 상태 변수들
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [inputSessionId, setInputSessionId] = useState(''); // 입력용 세션 ID
    const [isConnected, setIsConnected] = useState(false);

    // Ref 변수들 (DOM 요소 직접 접근 또는 값 유지)
    const publisherRef = useRef(null);
    // 구독자 Ref는 배열로 관리하며, 각 요소는 해당 구독자의 비디오 요소 Ref가 됩니다.
    // OpenVidu의 streamManager.addVideoElement는 DOM 요소를 필요로 하므로 Ref 사용이 적합합니다.
    const subscribersRef = useRef([]);

    useEffect(() => {
        subscribers.forEach((subscriber, index) => {
            if (subscribersRef.current[index] && !subscribersRef.current[index].hasChildNodes()) {
                subscriber.addVideoElement(subscribersRef.current[index]);
                console.log(`구독자 비디오 요소 추가 완료: index ${index}`);
            }
        });
    }, [subscribers]);


    // --- 유틸리티 함수들 ---

    // 컴포넌트 마운트 시 미디어 장치 권한 미리 요청 (Piece 3)
    const requestPermissions = async () => {
        try {
            // audio: true, video: true 권한을 요청합니다.
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            // 권한 확인 후 즉시 스트림을 중지하여 카메라/마이크를 사용하지 않도록 합니다.
            stream.getTracks().forEach(track => track.stop());
            console.log('미디어 권한 확인 완료');
            return true;
        } catch (error) {
            console.warn('미디어 권한 요청 실패:', error);
            // 사용자가 거부했거나 장치가 없을 수 있습니다.
            // OpenVidu는 initPublisher 단계에서 다시 권한을 요청하므로 여기서 실패해도 진행은 가능합니다.
            return false;
        }
    };

    // 토큰 받아오기 (Piece 1)
    const getToken = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:8081/api/sessions/${sessionId}/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const token = await response.text();
                console.log('토큰 받음:', token);
                return token;
            } else {
                // 서버에서 오류 발생 (예: 세션이 존재하지 않거나 내부 오류)
                const errorText = await response.text();
                console.error('토큰 생성 실패:', response.status, errorText);
                throw new Error(`토큰 생성 실패: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('토큰 생성 오류:', error);
            throw error;
        }
    };

    // 세션 생성/확인 함수 (Piece 1, 수정)
    // customSessionId를 제공하면 해당 ID로 생성/확인, 없으면 서버가 임의 생성
    const createSession = async (customSessionId = null) => {
        try {
            const body = customSessionId ?
                JSON.stringify({ customSessionId }) :
                JSON.stringify({});

            console.log(`세션 생성/확인 요청: customSessionId = ${customSessionId}`);

            const response = await fetch('http://localhost:8081/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });

            if (response.ok) {
                const sessionId = await response.text();
                console.log('세션 생성/확인됨:', sessionId);
                // 요청에 customSessionId를 보냈으면 그 ID를 반환, 아니면 서버가 생성한 ID 반환
                return customSessionId || sessionId;
            } else if (response.status === 409 && customSessionId) {
                // 409 Conflict는 customSessionId가 이미 존재함을 의미합니다.
                console.log('세션이 이미 존재함:', customSessionId);
                return customSessionId; // 이미 존재하는 세션 ID 반환
            } else {
                const errorText = await response.text();
                console.error('세션 생성/확인 실패:', response.status, errorText);
                throw new Error(`세션 생성/확인 실패: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('세션 생성 오류:', error);
            throw error; // 호출자에게 에러를 전파
        }
    };


    // --- 핵심 로직 함수들 ---

    // 새 세션 생성해서 입장하기 (Piece 1)
    const createAndJoinSession = async () => {
        try {
            // customSessionId를 제공하지 않으면 서버가 임의의 새 세션 ID 생성
            const newSessionId = await createSession();
            if (!newSessionId) {
                alert('새 세션 ID를 받아오지 못했습니다.');
                return;
            }
            await connectToSession(newSessionId);
        } catch (error) {
            console.error('새 세션 생성 및 입장 실패:', error);
            alert('새 세션 생성 및 입장에 실패했습니다.');
        }
    };

    // 기존 세션에 입장하기 (Piece 1, 수정)
    const joinExistingSession = async () => {
        const targetSessionId = inputSessionId.trim();
        if (!targetSessionId) {
            alert('세션 ID를 입력해주세요.');
            return;
        }

        try {
            // 1. 해당 세션 ID로 세션 생성/확인 (이미 존재하면 409 응답 후 해당 ID 반환)
            // 이 단계는 서버의 /api/sessions 엔드포인트가 POST 요청에 대해
            // customSessionId가 주어지면 해당 ID로 세션을 생성하거나, 이미 있으면 확인하고 해당 ID를 반환하는 로직이라고 가정합니다.
            const existingSessionId = await createSession(targetSessionId);

            if (!existingSessionId || existingSessionId !== targetSessionId) {
                // createSession 함수가 customSessionId를 반환해야 하는데 다른 값이 오거나 null이면 문제
                throw new Error(`세션 [${targetSessionId}] 확인/생성 실패`);
            }

            // 2. 확인된 세션 ID로 연결
            await connectToSession(existingSessionId);

        } catch (error) {
            console.error('세션 연결 실패:', error);
            // 사용자가 이해하기 쉬운 메시지로 alert
            let errorMessage = '세션 연결에 실패했습니다.';
            if (error.message.includes('404')) {
                errorMessage += ' 세션 ID를 확인해주세요.';
            } else {
                errorMessage += ' 관리자에게 문의해주세요.';
            }
            alert(errorMessage);
        }
    };

    // 세션에 연결하기 (공통 로직 - Piece 1, Piece 2 통합)
    const connectToSession = async (targetSessionId) => {
        try {
            // 1. OpenVidu 객체 및 세션 초기화
            const OV = new OpenVidu();
            // OpenVidu 로깅 레벨 설정 (디버깅 시 유용)
            // OV.setLogLevel('DEBUG'); // 'info', 'warn', 'error', 'none'

            const mySession = OV.initSession();
            setSession(mySession); // 상태에 세션 객체 저장

            // 2. 세션 이벤트 핸들러 설정 (Piece 2)
            mySession.on('streamCreated', (event) => {
                console.log('새로운 스트림 생성됨:', event.stream.streamId);
                try {
                    const subscriber = mySession.subscribe(event.stream, undefined);
                    console.log('구독자 생성됨:', subscriber);

                    setSubscribers(prev => [...prev, subscriber]);

                    // useEffect 대신 setTimeout 사용 (첫 번째 파일처럼)
                    setTimeout(() => {
                        const currentIndex = subscribersRef.current.length;
                        console.log(`구독자 비디오 요소 추가 시도: Ref index ${currentIndex}`);

                        if (subscribersRef.current[currentIndex]) {
                            subscriber.addVideoElement(subscribersRef.current[currentIndex]);
                            console.log(`구독자 비디오 요소 추가 완료: ${event.stream.streamId}`);
                        } else {
                            console.warn(`구독자 비디오 요소를 찾을 수 없음 (index: ${currentIndex})`);
                        }
                    }, 300); // 딜레이를 300ms로 늘려봐

                } catch (error) {
                    console.error('구독 실패:', error);
                    alert('다른 참가자의 화면을 불러오는데 실패했습니다.');
                }
            });


            mySession.on('streamDestroyed', (event) => {
                console.log('스트림 제거됨:', event.stream.streamId);
                // 해당 스트림을 가진 구독자를 상태에서 제거
                setSubscribers(prev => {
                    const nextSubscribers = prev.filter(sub => sub.stream.streamId !== event.stream.streamId);
                    // Ref 배열도 함께 정리 (중요!) - 상태와 Ref 동기화
                    // 제거된 구독자의 인덱스를 찾아서 Ref 배열에서도 해당 요소를 제거합니다.
                    const destroyedIndex = prev.findIndex(sub => sub.stream.streamId === event.stream.streamId);
                    if(destroyedIndex !== -1 && subscribersRef.current[destroyedIndex]) {
                        // 해당 DOM 요소를 Ref 배열에서 제거
                        subscribersRef.current.splice(destroyedIndex, 1);
                        console.log(`구독자 Ref 제거 완료 (index: ${destroyedIndex})`);
                    } else {
                        console.warn(`제거된 구독자에 해당하는 Ref 요소를 찾을 수 없음 (streamId: ${event.stream.streamId})`);
                    }
                    return nextSubscribers;
                });
                console.log('구독자 목록 업데이트됨');
            });

            // 연결 관련 이벤트 추가 (Piece 2)
            mySession.on('connectionCreated', (event) => {
                // 자신의 연결 생성은 무시 (connect 호출 결과)
                if (event.connection.connectionId !== mySession.connection.connectionId) {
                    console.log('새 연결 생성됨 (다른 참가자):', event.connection.connectionId);
                    // event.connection.data 등을 통해 사용자 정보 확인 가능
                } else {
                    console.log('내 연결 생성됨:', event.connection.connectionId);
                }
            });

            mySession.on('connectionDestroyed', (event) => {
                console.log('연결 종료됨:', event.connection.connectionId);
                // 해당 연결의 스트림은 streamDestroyed 이벤트로 처리됩니다.
            });

            // 예외 처리 이벤트 추가 (Piece 2)
            mySession.on('exception', (exception) => {
                console.warn('세션 예외 발생:', exception);
                // exception.name, exception.origin, exception.message 등을 확인하여 처리
                alert('화상통화 중 문제가 발생했습니다: ' + exception.name);
            });

            // 3. 사용 가능한 장치 확인 (Piece 1, 수정)
            let hasVideo = true;
            let hasAudio = true;

            try {
                const devices = await OV.getDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                const audioDevices = devices.filter(device => device.kind === 'audioinput');

                hasVideo = videoDevices.length > 0;
                hasAudio = audioDevices.length > 0;

                console.log(`사용 가능한 비디오 장치: ${videoDevices.length > 0 ? '있음' : '없음'}`);
                console.log(`사용 가능한 오디오 장치: ${audioDevices.length > 0 ? '있음' : '없음'}`);

                if (!hasVideo) console.warn('비디오 장치를 찾을 수 없습니다. 비디오 없이 참여합니다.');
                if (!hasAudio) console.warn('오디오 장치를 찾을 수 없습니다. 오디오 없이 참여합니다.');

            } catch (error) {
                console.warn('장치 확인 실패:', error);
                // 장치 확인 실패 시에도 연결은 시도하되, 비디오/오디오를 비활성화합니다.
                hasVideo = false;
                hasAudio = false;
                alert('미디어 장치를 확인하는데 문제가 발생했습니다.');
            }

            // 4. 서버로부터 토큰 받아오기 (Piece 1)
            const token = await getToken(targetSessionId);

            // 5. 세션 연결
            await mySession.connect(token);
            console.log('OpenVidu 세션 연결 성공!');

            // 6. Publisher 생성 및 설정 (Piece 1, 수정)
            // 장치 상태에 따라 Publisher 옵션 설정
            const publisherOptions = {
                audioSource: hasAudio ? undefined : false, // undefined: 기본 오디오 장치 사용, false: 오디오 비활성화
                videoSource: hasVideo ? undefined : false, // undefined: 기본 비디오 장치 사용, false: 비디오 비활성화
                publishAudio: hasAudio, // 오디오 스트림 발행 여부
                publishVideo: hasVideo, // 비디오 스트림 발행 여부
                resolution: hasVideo ? '640x480' : undefined, // 비디오 해상도 (비디오가 있을 때만 설정)
                frameRate: hasVideo ? 30 : undefined, // 프레임 레이트 (비디오가 있을 때만 설정)
                insertMode: 'APPEND', // 비디오 요소를 추가할 방법 (수동 추가할 것이므로 큰 의미는 없음)
                mirror: true // 내 화면 거울 모드
            };

            console.log('Publisher 옵션:', publisherOptions);

            const myPublisher = await OV.initPublisher(undefined, publisherOptions); // undefined는 비디오 요소를 직접 관리하겠다는 의미
            console.log('Publisher 초기화 완료:', myPublisher);

            // 7. 생성된 Publisher를 세션에 발행 (Publish)
            await mySession.publish(myPublisher);
            console.log('Publisher 발행 완료!');

            // 8. 상태 업데이트 및 비디오 요소 추가
            setPublisher(myPublisher);
            setSessionId(targetSessionId);
            setIsConnected(true);
            setInputSessionId(''); // 입력 필드 초기화

            // 내 비디오 요소 추가 (비디오 장치가 있을 때만)
            if (hasVideo) {
                setTimeout(() => {
                    if (publisherRef.current) {
                        myPublisher.addVideoElement(publisherRef.current);
                        console.log('내 비디오 요소 추가 완료');
                    } else {
                        console.warn('PublisherRef가 준비되지 않아 비디오 요소 추가 실패');
                    }
                }, 100); // DOM 업데이트 후 Ref가 준비될 시간을 기다림
            }


            console.log(`화상통화 연결 완료! 세션 ID: ${targetSessionId}`);

        } catch (error) {
            console.error('화상통화 연결 실패:', error);
            // 연결 실패 시 상태 초기화
            if (session) {
                session.disconnect();
            }
            setSession(null);
            setPublisher(null);
            setSubscribers([]);
            setIsConnected(false);
            setSessionId('');
            // Ref 배열도 초기화
            subscribersRef.current = [];

            // 에러 메시지를 사용자에게 알림
            let errorMessage = '화상통화 연결에 실패했습니다.';
            if (error.message.includes('token')) {
                errorMessage += ' (토큰 오류)';
            } else if (error.message.includes('device')) {
                errorMessage += ' (장치 접근 오류)';
            } else if (error.message.includes('connect')) {
                errorMessage += ' (연결 오류)';
            }
            alert(errorMessage + ': ' + error.message);
        }
    };

    // 화상통화 종료하기 (Piece 1)
    const leaveSession = () => {
        // OpenVidu 세션 연결 해제
        if (session) {
            console.log('세션 연결 해제 중...');
            session.disconnect();
        }

        // 상태 및 Ref 초기화
        setSession(null);
        setPublisher(null);
        setSubscribers([]);
        setIsConnected(false);
        setSessionId('');
        setInputSessionId('');
        subscribersRef.current = []; // Ref 배열 초기화도 중요!

        console.log('화상통화 종료됨');
    };

    // --- Effect Hook (Piece 3) ---
    // 컴포넌트가 처음 마운트될 때 미디어 장치 권한을 미리 요청
    useEffect(() => {
        console.log('컴포넌트 마운트됨, 미디어 권한 요청 시도');
        requestPermissions();

        // 컴포넌트 언마운트 시 세션이 연결되어 있으면 연결 해제 (클린업)
        return () => {
            console.log('컴포넌트 언마운트됨, 세션 클린업');
            if (session) {
                session.disconnect();
            }
        };
    }, [session]); // session 상태가 변경될 때 (null -> 객체, 객체 -> null) 클린업 로직이 실행되도록 의존성 추가

    // --- 렌더링 부분 ---
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>MOIM 화상통화</h1>

            {/* 연결되지 않았을 때 보여주는 UI */}
            {!isConnected ? (
                <div>
                    {/* 새 세션 생성 버튼 */}
                    <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                        <h3 style={{ marginTop: '0', marginBottom: '10px' }}>새 화상통화 시작</h3>
                        <button
                            onClick={createAndJoinSession}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s ease'
                            }}
                        >
                            새 세션 만들기 및 참여
                        </button>
                    </div>

                    {/* 기존 세션 입장 UI */}
                    <div style={{
                        border: '1px solid #ddd',
                        padding: '20px',
                        borderRadius: '5px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>기존 세션에 참여하기</h3>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="세션 ID를 입력하세요"
                                value={inputSessionId}
                                onChange={(e) => setInputSessionId(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        joinExistingSession();
                                    }
                                }}
                                style={{
                                    padding: '10px',
                                    fontSize: '16px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    flex: '1',
                                    minWidth: '250px', // 최소 너비 지정
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                onClick={joinExistingSession}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
                                }}
                            >
                                참여하기
                            </button>
                        </div>
                        <p style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
                            다른 참가자와 공유된 세션 ID를 입력하고 참여할 수 있습니다.
                        </p>
                    </div>
                </div>
            ) : (
                /* 연결되었을 때 보여주는 UI */
                <div>
                    <button
                        onClick={leaveSession}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        화상통화 종료
                    </button>

                    {/* 비디오 스트림 컨테이너 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // 최소 300px 너비, 자동 채움
                        gap: '20px',
                        justifyContent: 'center' // 가운데 정렬
                    }}>
                        {/* 내 비디오 */}
                        <div style={{
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            overflow: 'hidden', // 비디오 모서리 둥글게
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h3 style={{
                                marginTop: '0',
                                marginBottom: '10px',
                                padding: '10px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                내 화면 ({publisher ? (publisher.stream.hasVideo ? 'ON' : 'OFF') : '...'})
                            </h3>
                            {/* 비디오 요소가 삽입될 위치 */}
                            {/* 비디오 장치가 없으면 검은 배경 또는 메시지 표시 */}
                            <div ref={publisherRef} style={{
                                width: '100%', // 부모 컨테이너 너비에 맞춤
                                paddingBottom: '75%', // 4:3 비율 유지 (높이/너비 = 0.75)
                                position: 'relative', // 자식 absolute 위한 설정
                                backgroundColor: '#000', // 비디오 없을 때 배경
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white'
                            }}>
                                {publisher && !publisher.stream.hasVideo && (
                                    <p>비디오 장치 없음</p>
                                )}
                                {/* OpenVidu가 이 div 안에 <video> 요소를 추가합니다 */}
                            </div>
                        </div>

                        {/* 다른 참가자들 비디오 */}
                        {subscribers.map((subscriber, index) => (
                            <div key={subscriber.stream.streamId} style={{
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h3 style={{
                                    marginTop: '0',
                                    marginBottom: '10px',
                                    padding: '10px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    참가자 {index + 1} ({subscriber.stream.connection.data || 'Unknown'}) ({subscriber.stream.hasVideo ? 'ON' : 'OFF'})
                                </h3>
                                {/* 비디오 요소가 삽입될 위치 */}
                                <div
                                    ref={el => subscribersRef.current[index] = el} // 각 구독자에 해당하는 Ref 할당
                                    style={{
                                        width: '100%',
                                        paddingBottom: '75%', // 4:3 비율 유지
                                        position: 'relative',
                                        backgroundColor: '#000', // 비디오 없을 때 배경
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: 'white'
                                    }}
                                >
                                    {/* OpenVidu가 이 div 안에 <video> 요소를 추가합니다 */}
                                    {!subscriber.stream.hasVideo && (
                                        <p>비디오 장치 없음</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 현재 세션 정보 */}
                    <p style={{ marginTop: '20px', color: '#666', textAlign: 'center' }}>
                        현재 세션 ID: <strong>{sessionId}</strong> (이 ID를 공유하여 다른 참가자를 초대하세요)
                    </p>
                </div>
            )}
        </div>
    );
}

export default VideoCall;