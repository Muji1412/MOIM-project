import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OpenVidu } from 'openvidu-browser';

const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8089'  // ⚠️ 포트 번호는 본인 백엔드 서버에 맞게 수정
    : 'https://moim.o-r.kr';

// --- Helper Component ---
const UserVideo = React.memo(({ streamManager, onClick, isMuted }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (streamManager && videoRef.current) {
            streamManager.addVideoElement(videoRef.current);
        }
    }, [streamManager]);

    const getUserName = () => {
        try {
            return JSON.parse(streamManager.stream.connection.data).clientData;
        } catch (e) {
            return 'Participant';
        }
    };

    return (
        <div className="video-item-container" onClick={onClick}>
            <video autoPlay={true} ref={videoRef} muted={isMuted} />
            <div className="participant-name">{getUserName()}</div>
        </div>
    );
});

function Videocall() {
    // --- State Management ---
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [sessionIdInput, setSessionIdInput] = useState('');
    const [userName, setUserName] = useState(`User_${Math.floor(Math.random() * 100)}`);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [mainStreamManager, setMainStreamManager] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [autoJoin, setAutoJoin] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);


    useEffect(() => {
        const getStoredData = () => {
            try {
                const storedData = sessionStorage.getItem('videoChatData');
                if (storedData) {
                    const data = JSON.parse(storedData);
                    setChatData(data);
                    console.log('받은 채팅 데이터:', data);
                    // 자동 연결 데이터가 있으면 폼을 보여주지 않음
                    setShowJoinForm(false);
                } else {
                    // 자동 연결 데이터가 없으면 폼을 보여줌
                    setShowJoinForm(true);
                }
            } catch (error) {
                console.error('데이터 로딩 오류:', error);
                setShowJoinForm(true); // 오류 시에도 폼 보여줌
            }
        };

        getStoredData();
    }, []);

    useEffect(() => {
        if (chatData) {
            setSessionIdInput(chatData.roomId);
            setUserName(chatData.userName);
            setAutoJoin(true);
            setShowJoinForm(false); // 확실하게 폼 숨김
        }
    }, [chatData]);

    useEffect(() => {
        if (autoJoin && sessionIdInput && userName) {
            joinSession();
            setAutoJoin(false);
        }
    }, [autoJoin, sessionIdInput, userName]);
    // --- Refs ---
    const OV = useRef(new OpenVidu());
    const sessionRef = useRef(null); // 세션 객체를 ref에 저장하여 최신 상태를 유지

    // --- Session State Synchronization ---
    // session 상태가 변경될 때마다 ref에도 최신 값을 반영
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);


    // =========================================================================
    // !!!!! 여기가 핵심 수정 부분입니다 !!!!!
    //
    // 이 useEffect는 의존성 배열이 `[]` 이므로,
    // 컴포넌트가 "처음 생성될 때"와 "완전히 사라질 때" 단 한 번씩만 실행됩니다.
    // 상태가 변해도 중간에 재실행되지 않으므로, 연결되자마자 끊기는 문제가 발생하지 않습니다.
    //
    // 컴포넌트가 사라질 때(unmount), ref에 저장된 최신 세션의 연결을 끊습니다.
    // =========================================================================
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (sessionRef.current) {
                sessionRef.current.disconnect();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (sessionRef.current) {
                console.log('컴포넌트가 사라지면서 세션 연결을 종료합니다.');
                sessionRef.current.disconnect();
            }
        };
    }, []); // <-- 의존성 배열을 비워서 최초 1회만 실행되도록 설정


    // 세션 참여 로직 (내부 로직은 동일)
    const joinSession = async (e) => {
        if (e) e.preventDefault();
        try {
            const roomName = sessionIdInput || "default-room-moim";
            const mySession = OV.current.initSession();

            mySession.on('streamCreated', (event) => {
                const subscriber = mySession.subscribe(event.stream, undefined);
                setSubscribers((prev) => [...prev, subscriber]);
            });
            mySession.on('streamDestroyed', (event) => {
                if (mainStreamManager && mainStreamManager.stream.streamId === event.stream.streamId) {
                    setMainStreamManager(null);
                }
                setSubscribers((prev) => prev.filter((sub) => sub.stream.streamId !== event.stream.streamId));
            });
            mySession.on('exception', (exception) => console.warn("OpenVidu 예외: ", exception));

            const response = await fetch(`${APPLICATION_SERVER_URL}/api/sessions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customSessionId: roomName }),
            });
            if (!response.ok) throw new Error(`세션 생성 실패: ${response.status}`);
            const sessionId = await response.text();

            const tokenResponse = await fetch(`${APPLICATION_SERVER_URL}/api/sessions/${sessionId}/connections`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
            });
            if (!tokenResponse.ok) throw new Error(`토큰 발급 실패: ${tokenResponse.status}`);
            const token = await tokenResponse.text();

            await mySession.connect(token, { clientData: userName });

            const myPublisher = await OV.current.initPublisherAsync(undefined, {
                audioSource: undefined, videoSource: undefined, publishAudio: isMicEnabled, publishVideo: isVideoEnabled,
                resolution: '1280x720', frameRate: 30, insertMode: 'APPEND', mirror: true,
            });
            await mySession.publish(myPublisher);

            setSession(mySession);
            setPublisher(myPublisher);
            setIsConnected(true);
            setShowJoinForm(false)
        } catch (error) {
            console.error('세션 참여 실패:', error);
            alert(`연결 실패: ${error.message}`);
            // 연결 실패 시에만 폼을 다시 보여줄지 결정
            if (!chatData) {
                setShowJoinForm(true);
            }
        }
    };

    // UI에서 사용하는 '나가기' 버튼용 함수
    const leaveSession = () => {
        if (session) {
            session.disconnect();
            window.close();
        }
    };

    // --- UI Control Handlers ---
    const toggleMicrophone = () => publisher?.publishAudio(!isMicEnabled);
    const toggleVideo = () => publisher?.publishVideo(!isVideoEnabled);

    useEffect(() => {
        if(publisher) {
            publisher.on('streamPropertyChanged', (event) => {
                if (event.changedProperty === 'audioActive') {
                    setIsMicEnabled(event.newValue);
                }
                if (event.changedProperty === 'videoActive') {
                    setIsVideoEnabled(event.newValue);
                }
            });
        }
    }, [publisher]);

    const handleMainVideoStream = (stream) => {
        if (mainStreamManager?.stream.streamId === stream.stream.streamId) {
            setMainStreamManager(null);
        } else {
            setMainStreamManager(stream);
        }
    };


    // --- Render Logic ---

    // 접속 전 UI
    if (!isConnected && !autoJoin && !chatData) {
        return (
            <>
                <style>{joinFormStyles}</style>
                <div className="join-container">
                    <div className="join-form-wrapper">
                        <h1>MOIM 화상통화</h1>
                        <form onSubmit={joinSession}>
                            <input type="text" placeholder="사용자 이름을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                            <input type="text" placeholder="방 이름을 입력하거나 비워두세요" value={sessionIdInput} onChange={(e) => setSessionIdInput(e.target.value)} />
                            <button type="submit">참여하기</button>
                        </form>
                        <p>같은 방 이름을 입력한 사람들끼리 화상통화가 됩니다.</p>
                    </div>
                </div>
            </>
        );
    }

    // 접속 후 UI
    const allParticipants = [publisher, ...subscribers].filter(Boolean);
    const effectiveMainStreamManager = mainStreamManager || (allParticipants.length > 0 ? allParticipants[0] : null);
    const otherParticipants = allParticipants.filter(p => effectiveMainStreamManager && p.stream.streamId !== effectiveMainStreamManager.stream.streamId);

    const getGridLayoutClass = (count) => {
        if (count === 1) return 'grid-cols-1 grid-rows-1';
        if (count === 2) return 'grid-cols-2 grid-rows-1';
        return 'grid-cols-2 grid-rows-2';
    };
    const useFocusedLayout = allParticipants.length > 4 || !!mainStreamManager;

    return (
        <>
            <style>{videoCallStyles}</style>
            <div className="video-call-wrapper">
                <div className="main-content">
                    {useFocusedLayout ? (
                        <div className="focused-layout">
                            <div className="main-video-container">
                                {effectiveMainStreamManager && (
                                    <UserVideo streamManager={effectiveMainStreamManager} onClick={() => handleMainVideoStream(effectiveMainStreamManager)} isMuted={publisher === effectiveMainStreamManager}/>
                                )}
                            </div>
                            <div className="thumbnail-strip">
                                {otherParticipants.map(p => (
                                    <UserVideo key={p.stream.streamId} streamManager={p} onClick={() => handleMainVideoStream(p)} isMuted={publisher === p}/>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`grid-layout ${getGridLayoutClass(allParticipants.length)}`}>
                            {allParticipants.map(p => (
                                <UserVideo key={p.stream.streamId} streamManager={p} onClick={() => handleMainVideoStream(p)} isMuted={publisher === p}/>
                            ))}
                        </div>
                    )}
                </div>

                <div className="controls-bar">
                    <button onClick={toggleMicrophone} className={`control-btn ${isMicEnabled ? 'on' : 'off'}`}>{isMicEnabled ? '🎤' : '🔇'}</button>
                    <button onClick={toggleVideo} className={`control-btn ${isVideoEnabled ? 'on' : 'off'}`}>{isVideoEnabled ? '📹' : '📵'}</button>
                    <button onClick={leaveSession} className="control-btn leave">🚪</button>
                </div>
            </div>
        </>
    );
}


// --- CSS Styles (unchanged) ---
const joinFormStyles = `
    .join-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; font-family: sans-serif; }
    .join-form-wrapper { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; color: #333; }
    .join-form-wrapper h1 { margin-bottom: 24px; font-size: 28px; font-weight: 600; }
    .join-form-wrapper input { display: block; width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
    .join-form-wrapper button { width: 100%; padding: 14px; background-color: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background-color 0.3s; font-weight: 500; }
    .join-form-wrapper button:hover { background-color: #0056b3; }
    .join-form-wrapper p { margin-top: 20px; color: #666; font-size: 14px; line-height: 1.5; }
`;
const videoCallStyles = `
    .video-call-wrapper { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; background-color: #202124; color: #fff; }
    .main-content { flex-grow: 1; display: flex; padding: 16px; gap: 16px; overflow: hidden; }
    .focused-layout { display: flex; flex-direction: column; flex-grow: 1; gap: 16px; width: 100%; height: 100%; }
    .main-video-container { flex-grow: 1; display: flex; justify-content: center; align-items: center; background-color: #000; border-radius: 12px; overflow: hidden; position: relative; min-height: 0; }
    .thumbnail-strip { display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; flex-shrink: 0; max-height: 180px; overflow-y: auto; padding: 8px; }
    .thumbnail-strip .video-item-container { width: 240px; height: 160px; flex-shrink: 0; }
    .grid-layout { display: grid; flex-grow: 1; gap: 16px; width: 100%; height: 100%; align-content: center; justify-content: center; }
    .grid-layout.grid-cols-1 { grid-template-columns: minmax(0, 1fr); }
    .grid-layout.grid-rows-1 { grid-template-rows: minmax(0, 1fr); }
    .grid-layout.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-layout.grid-rows-2 { grid-template-rows: repeat(2, minmax(0, 1fr)); }
    .video-item-container { position: relative; background-color: #3c4043; border-radius: 12px; overflow: hidden; transition: box-shadow 0.3s; border: 2px solid transparent; width: 100%; height: 100%; cursor: pointer; }
    .video-item-container:hover { box-shadow: 0 0 15px rgba(128, 189, 255, 0.7); }
    .video-item-container video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .participant-name { position: absolute; bottom: 8px; left: 8px; background: rgba(0, 0, 0, 0.6); padding: 4px 8px; border-radius: 6px; font-size: 14px; }
    .controls-bar { flex-shrink: 0; display: flex; justify-content: center; align-items: center; padding: 16px; background-color: #2c2d30; }
    .control-btn { background: #4a4a4a; color: white; border: none; width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; margin: 0 10px; cursor: pointer; transition: background-color 0.3s; }
    .control-btn.on { background-color: #8ab4f8; color: #202124; }
    .control-btn.off { background-color: #3c4043; }
    .control-btn.leave { background-color: #ea4335; }
`;

export default Videocall;