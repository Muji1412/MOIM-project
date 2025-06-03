import React, { useState, useEffect, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';

function VideoCall() {
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const publisherRef = useRef(null);
    const subscribersRef = useRef([]);

    // 세션 생성하기
    const createSession = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}) // 빈 객체 전송
            });

            if (response.ok) {
                const newSessionId = await response.text();
                setSessionId(newSessionId);
                console.log('세션 생성됨:', newSessionId);
                return newSessionId;
            } else {
                throw new Error('세션 생성 실패');
            }
        } catch (error) {
            console.error('세션 생성 오류:', error);
            alert('세션 생성에 실패했습니다.');
        }
    };

    // 토큰 받아오기
    const getToken = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:8081/api/sessions/${sessionId}/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}) // 빈 객체 전송
            });

            if (response.ok) {
                const token = await response.text();
                console.log('토큰 받음:', token);
                return token;
            } else {
                throw new Error('토큰 생성 실패');
            }
        } catch (error) {
            console.error('토큰 생성 오류:', error);
            throw error;
        }
    };

    // 화상통화 시작하기
    const joinSession = async () => {
        try {
            // 1. 세션 생성
            const newSessionId = await createSession();
            if (!newSessionId) return;

            // 2. OpenVidu 객체 생성
            const OV = new OpenVidu();
            const mySession = OV.initSession();

            // 3. 세션 이벤트 설정
            mySession.on('streamCreated', (event) => {
                console.log('새로운 스트림 생성됨');
                const subscriber = mySession.subscribe(event.stream, undefined);
                setSubscribers(prev => [...prev, subscriber]);

                // 구독자 비디오를 DOM에 추가
                setTimeout(() => {
                    if (subscribersRef.current[subscribers.length]) {
                        subscriber.addVideoElement(subscribersRef.current[subscribers.length]);
                    }
                }, 100);
            });

            mySession.on('streamDestroyed', (event) => {
                console.log('스트림 제거됨');
                setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
            });

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

            // 7. 내 비디오를 DOM에 추가
            setTimeout(() => {
                if (publisherRef.current) {
                    myPublisher.addVideoElement(publisherRef.current);
                }
            }, 100);

            console.log('화상통화 연결 완료!');

        } catch (error) {
            console.error('화상통화 연결 실패:', error);
            alert('화상통화 연결에 실패했습니다.');
        }
    };

    // 화상통화 종료하기
    const leaveSession = () => {
        if (session) {
            session.disconnect();
            setSession(null);
            setPublisher(null);
            setSubscribers([]);
            setIsConnected(false);
            setSessionId('');
            console.log('화상통화 종료됨');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>MOIM 화상통화</h1>

            {!isConnected ? (
                <div>
                    <button
                        onClick={joinSession}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        화상통화 시작
                    </button>
                </div>
            ) : (
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
                            marginBottom: '20px'
                        }}
                    >
                        화상통화 종료
                    </button>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* 내 비디오 */}
                        <div>
                            <h3>내 화면</h3>
                            <video
                                ref={publisherRef}
                                autoPlay
                                muted
                                style={{
                                    width: '320px',
                                    height: '240px',
                                    backgroundColor: '#000',
                                    border: '2px solid #007bff'
                                }}
                            />
                        </div>

                        {/* 다른 참가자들 비디오 */}
                        {subscribers.map((subscriber, index) => (
                            <div key={index}>
                                <h3>참가자 {index + 1}</h3>
                                <video
                                    ref={el => subscribersRef.current[index] = el}
                                    autoPlay
                                    style={{
                                        width: '320px',
                                        height: '240px',
                                        backgroundColor: '#000',
                                        border: '2px solid #28a745'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <p style={{ marginTop: '20px', color: '#666' }}>
                        세션 ID: {sessionId}
                    </p>
                </div>
            )}
        </div>
    );
}

export default VideoCall;
