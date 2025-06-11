
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OpenVidu } from 'openvidu-browser';

// 배포버전 URL입니다. 리눅스 서버에 올릴때는 아래 url값을 써주세요.
//const APPLICATION_SERVER_URL = 'https://moim.o-r.kr';
// 로컬에서 테스트하는 경우에는 아래 값으로 바꿔주세요. 포트값은 유동적으로 바꿔도 됩니다.
const APPLICATION_SERVER_URL = 'http://localhost:8081';


function VideoCall() {
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [sessionIdInput, setSessionIdInput] = useState('');
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const publisherRef = useRef(null);

    // 토큰 받아오기
    const getToken = async (currentSessionId) => {
        try {
            const response = await fetch(`${APPLICATION_SERVER_URL}/api/sessions/${currentSessionId}/connections`, {
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
                const errorText = await response.text();
                console.error('토큰 생성 실패 응답:', errorText);
                throw new Error(`토큰 생성 실패: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('토큰 생성 오류:', error);
            throw error;
        }
    };

    // 스트림 생성 이벤트 핸들러 (useCallback으로 고정)
    const handleStreamCreated = useCallback((event) => {
        console.log('새로운 스트림 생성됨');
        if (session) {
            const subscriber = session.subscribe(event.stream, undefined);
            setSubscribers(prev => [...prev, subscriber]);
        } else {
            console.warn('세션이 아직 준비되지 않아 구독할 수 없습니다.');
        }
    }, [session]);

    // 스트림 제거 이벤트 핸들러 (useCallback으로 고정)
    const handleStreamDestroyed = useCallback((event) => {
        console.log('스트림 제거됨');
        setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
    }, []);

    // 마이크 토글 함수
    const toggleMicrophone = () => {
        if (publisher) {
            const newMicState = !isMicEnabled;
            publisher.publishAudio(newMicState);
            setIsMicEnabled(newMicState);
            console.log(`마이크 ${newMicState ? '켜짐' : '꺼짐'}`);
        }
    };

    // 비디오 토글 함수
    const toggleVideo = () => {
        if (publisher) {
            const newVideoState = !isVideoEnabled;
            publisher.publishVideo(newVideoState);
            setIsVideoEnabled(newVideoState);
            console.log(`비디오 ${newVideoState ? '켜짐' : '꺼짐'}`);
        }
    };

    // Publisher 비디오 요소 연결 (useEffect로 DOM 업데이트 감지)
    useEffect(() => {
        if (publisher && publisherRef.current) {
            console.log('Publisher 비디오 요소 연결 중...');
            publisher.addVideoElement(publisherRef.current);
            console.log('Publisher 비디오 요소 연결 완료');
        }
    }, [publisher]);

    // 세션 이벤트 리스너 등록 (useEffect로 관리)
    useEffect(() => {
        if (session) {
            session.on('streamCreated', handleStreamCreated);
            session.on('streamDestroyed', handleStreamDestroyed);

            // 컴포넌트 언마운트 시 또는 session이 변경될 때 리스너 제거
            return () => {
                session.off('streamCreated', handleStreamCreated);
                session.off('streamDestroyed', handleStreamDestroyed);
            };
        }
    }, [session, handleStreamCreated, handleStreamDestroyed]);

    // 화상통화 시작하기
    const joinSession = async () => {
        try {
            // 1. 입력받은 세션 ID로 세션 생성 (또는 기본값 사용)
            const roomName = sessionIdInput || "test-room-123";

            const response = await fetch(`${APPLICATION_SERVER_URL}/api/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customSessionId: roomName
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('세션 생성 실패 응답:', errorText);
                throw new Error(`세션 생성 실패: ${response.status} ${errorText}`);
            }

            const newSessionId = await response.text();
            setSessionId(newSessionId);
            console.log('세션 생성됨:', newSessionId);

            // 2. OpenVidu 객체 생성
            const OV = new OpenVidu();
            const mySession = OV.initSession();

            // 3. 세션 상태 설정 (이벤트는 useEffect에서 처리)
            setSession(mySession);

            // 4. 토큰 받아서 세션 연결
            const token = await getToken(newSessionId);
            await mySession.connect(token);

            // 5. 내 비디오 퍼블리셔 생성
            const myPublisher = OV.initPublisher(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: '1280x720',
                frameRate: 30,
                insertMode: 'APPEND',
                mirror: false
            });

            // 6. 퍼블리셔를 세션에 발행
            await mySession.publish(myPublisher);
            setPublisher(myPublisher);
            setIsConnected(true);

            console.log('화상통화 연결 완료!');
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
            alert(`화상통화 연결에 실패했습니다: ${error.message}`);
        }
    };

    // 화상통화 종료하기
    const leaveSession = () => {
        if (session) {
            session.disconnect();
        }
        // 상태 초기화
        setSession(null);
        setPublisher(null);
        setSubscribers([]);
        setIsConnected(false);
        setSessionId('');
        setSessionIdInput('');
        setIsMicEnabled(true);
        setIsVideoEnabled(true);
        console.log('화상통화 종료됨');
    };

    return React.createElement('div', { style: { padding: '20px' } },
        React.createElement('h1', null, 'MOIM 화상통화'),

        !isConnected ?
            React.createElement('div', null,
                React.createElement('input', {
                    type: 'text',
                    placeholder: '방 이름을 입력하세요 (예: room-123) 또는 비워두세요',
                    value: sessionIdInput,
                    onChange: (e) => setSessionIdInput(e.target.value),
                    style: {
                        padding: '10px',
                        marginRight: '10px',
                        width: '300px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '5px'
                    }
                }),
                React.createElement('button', {
                    onClick: joinSession,
                    style: {
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }
                }, '화상통화 시작'),
                React.createElement('p', {
                    style: { marginTop: '10px', color: '#666', fontSize: '14px' }
                }, '같은 방 이름을 입력한 사람들끼리 화상통화가 됩니다.', React.createElement('br'), '비워두면 기본 방(test-room-123)에 입장합니다.')
            )
            :
            React.createElement('div', null,
                // 컨트롤 버튼들
                React.createElement('div', { style: { marginBottom: '20px' } },
                    React.createElement('button', {
                        onClick: toggleMicrophone,
                        style: {
                            padding: '10px 15px',
                            marginRight: '10px',
                            backgroundColor: isMicEnabled ? '#28a745' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }
                    }, isMicEnabled ? '🎤 마이크 켜짐' : '🔇 마이크 꺼짐'),

                    React.createElement('button', {
                        onClick: toggleVideo,
                        style: {
                            padding: '10px 15px',
                            marginRight: '10px',
                            backgroundColor: isVideoEnabled ? '#28a745' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }
                    }, isVideoEnabled ? '📹 비디오 켜짐' : '📵 비디오 꺼짐'),

                    React.createElement('button', {
                        onClick: leaveSession,
                        style: {
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }
                    }, '화상통화 종료')
                ),

                React.createElement('div', { style: { display: 'flex', gap: '20px', flexWrap: 'wrap' } },
                    // 내 비디오
                    publisher && React.createElement('div', null,
                        React.createElement('h3', null, '내 화면'),
                        React.createElement('video', {
                            ref: publisherRef,
                            autoPlay: true,
                            muted: true,
                            style: {
                                width: '320px',
                                height: '240px',
                                backgroundColor: '#000',
                                border: '2px solid #007bff',
                                objectFit: 'contain'
                            }
                        })
                    ),

                    // 다른 참가자들 비디오
                    ...subscribers.map((subscriber, index) =>
                        React.createElement('div', { key: subscriber.stream.streamId || index },
                            React.createElement('h3', null, `참가자 ${index + 1}`),
                            React.createElement('video', {
                                ref: (el) => {
                                    if (el && subscriber) {
                                        console.log(`Subscriber ${index} 비디오 요소 연결 중 (streamId: ${subscriber.stream.streamId})...`);
                                        subscriber.addVideoElement(el);
                                        console.log(`Subscriber ${index} 비디오 요소 연결 완료`);
                                    }
                                },
                                autoPlay: true,
                                style: {
                                    width: '320px',
                                    height: '240px',
                                    backgroundColor: '#000',
                                    border: '2px solid #28a745',
                                    objectFit: 'contain'
                                }
                            })
                        )
                    )
                ),

                React.createElement('p', {
                    style: { marginTop: '20px', color: '#666' }
                }, `현재 방: ${sessionId}`)
            )
    );
}

export default VideoCall;


// v2
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { OpenVidu } from 'openvidu-browser';
//
// // API 서버 URL을 명확하게 지정합니다.
// // 브라우저에서 접속하는 주소와 동일하게 맞춰주는 것이 좋습니다.
// const APPLICATION_SERVER_URL = 'https://moim.o-r.kr';
//
// function VideoCall() {
//     const [session, setSession] = useState(null);
//     const [publisher, setPublisher] = useState(null);
//     const [subscribers, setSubscribers] = useState([]);
//     const [sessionId, setSessionId] = useState('');
//     const [isConnected, setIsConnected] = useState(false);
//     const [sessionIdInput, setSessionIdInput] = useState('');
//     const publisherRef = useRef(null);
//     const [isMicEnabled, setIsMicEnabled] = useState(true); // 마이크 상태관리 state
//     const [isVideoEnabled, setIsVideoEnabled] = useState(true); // 비디오 상태관리 state
//
//     // 토큰 받아오기
//     const getToken = async (currentSessionId) => { // 파라미터 이름 변경 (sessionId와 혼동 방지)
//         try {
//             // API URL 수정
//             const response = await fetch(`${APPLICATION_SERVER_URL}/api/sessions/${currentSessionId}/connections`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({}) // 빈 객체 전송
//             });
//             if (response.ok) {
//                 const token = await response.text();
//                 console.log('토큰 받음:', token);
//                 return token;
//             } else {
//                 const errorText = await response.text();
//                 console.error('토큰 생성 실패 응답:', errorText);
//                 throw new Error(`토큰 생성 실패: ${response.status} ${errorText}`);
//             }
//         } catch (error) {
//             console.error('토큰 생성 오류:', error);
//             throw error;
//         }
//     };
//
//     // ... (handleStreamCreated, handleStreamDestroyed, useEffect 등 나머지 코드는 동일) ...
//     // 스트림 생성 이벤트 핸들러 (useCallback으로 고정)
//     const handleStreamCreated = useCallback((event) => {
//         console.log('새로운 스트림 생성됨');
//         if (session) { // session이 유효할 때만 subscribe 시도
//             const subscriber = session.subscribe(event.stream, undefined);
//             setSubscribers(prev => [...prev, subscriber]);
//         } else {
//             console.warn('세션이 아직 준비되지 않아 구독할 수 없습니다.');
//         }
//     }, [session]); // session을 의존성 배열에 추가
//
//     // 스트림 제거 이벤트 핸들러 (useCallback으로 고정)
//     const handleStreamDestroyed = useCallback((event) => {
//         console.log('스트림 제거됨');
//         setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
//     }, []);
//
//     // Publisher 비디오 요소 연결 (useEffect로 DOM 업데이트 감지)
//     useEffect(() => {
//         if (publisher && publisherRef.current) {
//             console.log('Publisher 비디오 요소 연결 중...');
//             publisher.addVideoElement(publisherRef.current);
//             console.log('Publisher 비디오 요소 연결 완료');
//         }
//     }, [publisher]);
//
//     // 세션 이벤트 리스너 등록 (useEffect로 관리)
//     useEffect(() => {
//         if (session) {
//             session.on('streamCreated', handleStreamCreated);
//             session.on('streamDestroyed', handleStreamDestroyed);
//
//             // 컴포넌트 언마운트 시 또는 session이 변경될 때 리스너 제거
//             return () => {
//                 session.off('streamCreated', handleStreamCreated);
//                 session.off('streamDestroyed', handleStreamDestroyed);
//             };
//         }
//     }, [session, handleStreamCreated, handleStreamDestroyed]);
//
//
//     // 화상통화 시작하기
//     const joinSession = async () => {
//         try {
//             // 1. 입력받은 세션 ID로 세션 생성 (또는 기본값 사용)
//             const roomName = sessionIdInput || "test-room-123";
//
//             // API URL 수정
//             const response = await fetch(`${APPLICATION_SERVER_URL}/api/sessions`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     customSessionId: roomName  // 고정된 또는 입력받은 세션 ID
//                 })
//             });
//
//             if (!response.ok) {
//                 const errorText = await response.text();
//                 console.error('세션 생성 실패 응답:', errorText);
//                 throw new Error(`세션 생성 실패: ${response.status} ${errorText}`);
//             }
//
//             const newSessionId = await response.text();
//             setSessionId(newSessionId);
//             console.log('세션 생성됨:', newSessionId);
//
//             // 2. OpenVidu 객체 생성
//             const OV = new OpenVidu();
//             const mySession = OV.initSession();
//
//             // 3. 세션 상태 설정 (이벤트는 useEffect에서 처리)
//             setSession(mySession); // 이 시점에 session 객체가 할당됨
//
//             // 4. 토큰 받아서 세션 연결
//             const token = await getToken(newSessionId); // 여기서 newSessionId를 사용
//             await mySession.connect(token);
//
//             // 5. 내 비디오 퍼블리셔 생성
//             const myPublisher = OV.initPublisher(undefined, { // 'publisherVideoElement' 대신 undefined 사용
//                 audioSource: undefined,
//                 videoSource: undefined,
//                 publishAudio: true,
//                 publishVideo: true,
//                 resolution: '1280x720', // 해상도 확인 (640x480 등 작은 값으로 테스트)
//                 frameRate: 30,
//                 insertMode: 'APPEND', // Publisher가 DOM에 추가될 방식
//                 mirror: false
//             });
//
//             // 6. 퍼블리셔를 세션에 발행
//             await mySession.publish(myPublisher);
//             setPublisher(myPublisher); // publisher 상태 업데이트
//             setIsConnected(true);
//
//             console.log('화상통화 연결 완료!');
//         } catch (error) {
//             console.error('화상통화 연결 실패:', error);
//             // 연결 실패 시 상태 초기화
//             if (session) {
//                 session.disconnect();
//             }
//             setSession(null);
//             setPublisher(null);
//             setSubscribers([]);
//             setIsConnected(false);
//             setSessionId('');
//             alert(`화상통화 연결에 실패했습니다: ${error.message}`);
//         }
//     };
//
//     // ... (leaveSession 및 JSX 부분은 거의 동일, publisherRef 사용 확인) ...
//     // 화상통화 종료하기
//     const leaveSession = () => {
//         if (session) {
//             session.disconnect();
//         }
//         // 상태 초기화
//         setSession(null);
//         setPublisher(null);
//         setSubscribers([]);
//         setIsConnected(false);
//         setSessionId(''); // 세션 ID도 초기화
//         setSessionIdInput(''); // 입력 필드도 초기화
//         console.log('화상통화 종료됨');
//     };
//     // 마이크 토글 함수
//     const toggleMicrophone = () => {
//         if (publisher) {
//             const newMicState = !isMicEnabled;
//             publisher.publishAudio(newMicState);
//             setIsMicEnabled(newMicState);
//         }
//     };
//
//     // 비디오 토글 함수
//     const toggleVideo = () => {
//         if (publisher) {
//             const newVideoState = !isVideoEnabled;
//             publisher.publishVideo(newVideoState);
//             setIsVideoEnabled(newVideoState);
//         }
//     };
//
//     return (
//         <div style={{ padding: '20px' }}>
//             <h1>MOIM 화상통화</h1>
//
//             {!isConnected ? (
//                 <div>
//                     <input
//                         type="text"
//                         placeholder="방 이름을 입력하세요 (예: room-123) 또는 비워두세요"
//                         value={sessionIdInput}
//                         onChange={(e) => setSessionIdInput(e.target.value)}
//                         style={{
//                             padding: '10px',
//                             marginRight: '10px',
//                             width: '300px',
//                             fontSize: '14px',
//                             border: '1px solid #ccc',
//                             borderRadius: '5px'
//                         }}
//                     />
//                     <button
//                         onClick={joinSession}
//                         style={{
//                             padding: '10px 20px',
//                             fontSize: '16px',
//                             backgroundColor: '#007bff',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '5px',
//                             cursor: 'pointer'
//                         }}
//                     >
//                         화상통화 시작
//                     </button>
//                     <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
//                         같은 방 이름을 입력한 사람들끼리 화상통화가 됩니다.<br/>
//                         비워두면 기본 방(test-room-123)에 입장합니다.
//                     </p>
//                 </div>
//             ) : (
//                 <div>
//                     <button
//                         onClick={leaveSession}
//                         style={{
//                             padding: '10px 20px',
//                             fontSize: '16px',
//                             backgroundColor: '#dc3545',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '5px',
//                             cursor: 'pointer',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         화상통화 종료
//                     </button>
//
//                     <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
//                         {/* 내 비디오 - publisherRef 사용 */}
//                         {publisher && ( // publisher가 있을 때만 렌더링
//                             <div>
//                                 <h3>내 화면</h3>
//                                 <video
//                                     ref={publisherRef}
//                                     autoPlay
//                                     muted // 내 화면은 음소거
//                                     style={{
//                                         width: '320px',
//                                         height: '240px',
//                                         backgroundColor: '#000',
//                                         border: '2px solid #007bff',
//                                         objectFit: 'contain'
//                                     }}
//                                 />
//                             </div>
//                         )}
//
//                         {/* 다른 참가자들 비디오 - Callback ref 사용 */}
//                         {subscribers.map((subscriber, index) => (
//                             <div key={subscriber.stream.streamId || index}> {/* streamId를 key로 사용 */}
//                                 <h3>참가자 {index + 1}</h3>
//                                 <video
//                                     ref={(el) => {
//                                         if (el && subscriber) {
//                                             console.log(`Subscriber ${index} 비디오 요소 연결 중 (streamId: ${subscriber.stream.streamId})...`);
//                                             subscriber.addVideoElement(el);
//                                             console.log(`Subscriber ${index} 비디오 요소 연결 완료`);
//                                         }
//                                     }}
//                                     autoPlay
//                                     style={{
//                                         width: '320px',
//                                         height: '240px',
//                                         backgroundColor: '#000',
//                                         border: '2px solid #28a745',
//                                         objectFit: 'contain'
//                                     }}
//                                 />
//                             </div>
//                         ))}
//                     </div>
//
//                     <p style={{ marginTop: '20px', color: '#666' }}>
//                         현재 방: {sessionId}
//                     </p>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// export default VideoCall;

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { OpenVidu } from 'openvidu-browser';
//
// function VideoCall() {
//     const [session, setSession] = useState(null);
//     const [publisher, setPublisher] = useState(null);
//     const [subscribers, setSubscribers] = useState([]);
//     const [sessionId, setSessionId] = useState('');
//     const [isConnected, setIsConnected] = useState(false);
//     const [sessionIdInput, setSessionIdInput] = useState('');
//     const publisherRef = useRef(null);
//
//     // 토큰 받아오기
//     const getToken = async (sessionId) => {
//         try {
//             const response = await fetch(`http://localhost:8081/api/sessions/${sessionId}/connections`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({}) // 빈 객체 전송
//             });
//             if (response.ok) {
//                 const token = await response.text();
//                 console.log('토큰 받음:', token);
//                 return token;
//             } else {
//                 throw new Error('토큰 생성 실패');
//             }
//         } catch (error) {
//             console.error('토큰 생성 오류:', error);
//             throw error;
//         }
//     };
//
//     // 스트림 생성 이벤트 핸들러 (useCallback으로 고정)
//     const handleStreamCreated = useCallback((event) => {
//         console.log('새로운 스트림 생성됨');
//         const subscriber = session.subscribe(event.stream, undefined);
//         setSubscribers(prev => [...prev, subscriber]);
//     }, [session]);
//
//     // 스트림 제거 이벤트 핸들러 (useCallback으로 고정)
//     const handleStreamDestroyed = useCallback((event) => {
//         console.log('스트림 제거됨');
//         setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
//     }, []);
//
//     // Publisher 비디오 요소 연결 (useEffect로 DOM 업데이트 감지)
//     useEffect(() => {
//         if (publisher && publisherRef.current) {
//             console.log('Publisher 비디오 요소 연결 중...');
//             publisher.addVideoElement(publisherRef.current);
//             console.log('Publisher 비디오 요소 연결 완료');
//         }
//     }, [publisher]);
//
//     // 세션 이벤트 리스너 등록 (useEffect로 관리)
//     useEffect(() => {
//         if (session) {
//             session.on('streamCreated', handleStreamCreated);
//             session.on('streamDestroyed', handleStreamDestroyed);
//
//             return () => {
//                 session.off('streamCreated', handleStreamCreated);
//                 session.off('streamDestroyed', handleStreamDestroyed);
//             };
//         }
//     }, [session, handleStreamCreated, handleStreamDestroyed]);
//
//     // 화상통화 시작하기
//     const joinSession = async () => {
//         try {
//             // 1. 입력받은 세션 ID로 세션 생성 (또는 기본값 사용)
//             const roomName = sessionIdInput || "test-room-123";
//
//             const response = await fetch('http://localhost:8081/api/sessions', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     customSessionId: roomName  // 고정된 또는 입력받은 세션 ID
//                 })
//             });
//
//             if (!response.ok) {
//                 throw new Error('세션 생성 실패');
//             }
//
//             const newSessionId = await response.text();
//             setSessionId(newSessionId);
//             console.log('세션 생성됨:', newSessionId);
//
//             // 2. OpenVidu 객체 생성
//             const OV = new OpenVidu();
//             const mySession = OV.initSession();
//
//             // 3. 세션 상태 설정 (이벤트는 useEffect에서 처리)
//             setSession(mySession);
//
//             // 4. 토큰 받아서 세션 연결
//             const token = await getToken(newSessionId);
//             await mySession.connect(token);
//
//             // 5. 내 비디오 퍼블리셔 생성
//             const myPublisher = OV.initPublisher(undefined, {
//                 audioSource: undefined,
//                 videoSource: undefined,
//                 publishAudio: true,
//                 publishVideo: true,
//                 resolution: '1280x720',
//                 frameRate: 30,
//                 insertMode: 'APPEND',
//                 mirror: false
//             });
//
//             // 6. 퍼블리셔를 세션에 발행
//             await mySession.publish(myPublisher);
//             setPublisher(myPublisher);
//             setIsConnected(true);
//
//             console.log('화상통화 연결 완료!');
//         } catch (error) {
//             console.error('화상통화 연결 실패:', error);
//             alert('화상통화 연결에 실패했습니다.');
//         }
//     };
//
//     // 화상통화 종료하기
//     const leaveSession = () => {
//         if (session) {
//             session.disconnect();
//             setSession(null);
//             setPublisher(null);
//             setSubscribers([]);
//             setIsConnected(false);
//             setSessionId('');
//             console.log('화상통화 종료됨');
//         }
//     };
//
//     return (
//         <div style={{ padding: '20px' }}>
//             <h1>MOIM 화상통화</h1>
//
//             {!isConnected ? (
//                 <div>
//                     <input
//                         type="text"
//                         placeholder="방 이름을 입력하세요 (예: room-123) 또는 비워두세요"
//                         value={sessionIdInput}
//                         onChange={(e) => setSessionIdInput(e.target.value)}
//                         style={{
//                             padding: '10px',
//                             marginRight: '10px',
//                             width: '300px',
//                             fontSize: '14px',
//                             border: '1px solid #ccc',
//                             borderRadius: '5px'
//                         }}
//                     />
//                     <button
//                         onClick={joinSession}
//                         style={{
//                             padding: '10px 20px',
//                             fontSize: '16px',
//                             backgroundColor: '#007bff',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '5px',
//                             cursor: 'pointer'
//                         }}
//                     >
//                         화상통화 시작
//                     </button>
//                     <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
//                         같은 방 이름을 입력한 사람들끼리 화상통화가 됩니다.<br/>
//                         비워두면 기본 방(test-room-123)에 입장합니다.
//                     </p>
//                 </div>
//             ) : (
//                 <div>
//                     <button
//                         onClick={leaveSession}
//                         style={{
//                             padding: '10px 20px',
//                             fontSize: '16px',
//                             backgroundColor: '#dc3545',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '5px',
//                             cursor: 'pointer',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         화상통화 종료
//                     </button>
//
//                     <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
//                         {/* 내 비디오 - 직접 video 태그 사용 */}
//                         <div>
//                             <h3>내 화면</h3>
//                             <video
//                                 ref={publisherRef}
//                                 autoPlay
//                                 muted
//                                 style={{
//                                     width: '320px',
//                                     height: '240px',
//                                     backgroundColor: '#000',
//                                     border: '2px solid #007bff',
//                                     objectFit: 'contain'
//                                 }}
//                             />
//                         </div>
//
//                         {/* 다른 참가자들 비디오 - Callback ref 사용 */}
//                         {subscribers.map((subscriber, index) => (
//                             <div key={subscriber.id || index}>
//                                 <h3>참가자 {index + 1}</h3>
//                                 <video
//                                     ref={(el) => {
//                                         if (el && subscriber) {
//                                             console.log(`Subscriber ${index} 비디오 요소 연결 중...`);
//                                             subscriber.addVideoElement(el);
//                                             console.log(`Subscriber ${index} 비디오 요소 연결 완료`);
//                                         }
//                                     }}
//                                     autoPlay
//                                     style={{
//                                         width: '320px',
//                                         height: '240px',
//                                         backgroundColor: '#000',
//                                         border: '2px solid #28a745',
//                                         objectFit: 'contain'
//                                     }}
//                                 />
//                             </div>
//                         ))}
//                     </div>
//
//                     <p style={{ marginTop: '20px', color: '#666' }}>
//                         현재 방: {sessionId}
//                     </p>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// export default VideoCall;
