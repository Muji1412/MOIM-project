import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import './chattingView.css';

function ChattingView() {
    // 채팅 메시지 목록을 저장할 state (화면에 표시되는 메시지들)
    const [messages, setMessages] = useState([]);
    // 입력창에 입력된 값을 저장할 state
    const [inputValue, setInputValue] = useState('');
    // STOMP 클라이언트 인스턴스를 저장할 ref (컴포넌트가 다시 렌더링되어도 값이 유지됨)
    const stompClient = useRef(null);
    // 채널명 (방 이름) - 여기서는 예시로 'general' 사용
    const channel = "general";

    // 컴포넌트가 처음 화면에 나타날 때, 그리고 channel이 바뀔 때 실행됨
    useEffect(() => {
        // 1. STOMP 클라이언트 생성 (WebSocket 연결)
        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8089/ws"), // 서버 WebSocket 엔드포인트
            debug: (str) => {
                // STOMP 내부 로그를 보기 좋게 출력 (디버깅에 도움)
                console.log("%c[STOMP]", "color: green", str);
            },
            reconnectDelay: 5000 // 연결이 끊기면 5초 후 자동 재연결
        });

        // 2. 서버와 연결이 성공하면 실행되는 함수
        client.onConnect = () => {
            // 채널(방) 구독: 이 채널의 메시지를 모두 실시간으로 받겠다!
            client.subscribe(`/topic/chat/${channel}`, (msg) => {
                const message = JSON.parse(msg.body); // 서버에서 받은 메시지(JSON)를 객체로 변환
                // 새 메시지를 messages state에 추가 (화면에 바로 표시)
                setMessages(prev => [...prev, message]);
            });
            console.log("%c[WebSocket 연결 성공!]", "color: blue; font-weight: bold");
            // 구독 등 추가 로직
        };

        client.onDisconnect = () => {
            // 연결이 정상적으로 닫혔을 때 실행
            console.log("%c[WebSocket 연결 종료]", "color: orange; font-weight: bold");
        };

        client.onStompError = (frame) => {
            console.error("[WebSocket 연결 에러]", frame);
        };


        // 3. 클라이언트 활성화 (실제로 연결 시작)
        client.activate();
        stompClient.current = client; // 나중에 publish(메시지 전송)할 때 사용

        // 4. 과거 메시지 조회 (REST API로 오늘 날짜의 메시지 가져오기)
        fetch(`http://localhost:8089/api/chat/${channel}/${getToday()}`)
            .then(res => res.json())
            .then(data => setMessages(data)); // 가져온 메시지들을 화면에 표시

        // 5. 컴포넌트가 사라질 때(언마운트) WebSocket 연결 해제
        return () => {
            client.deactivate();
        };
    }, [channel]); // channel이 바뀔 때마다 다시 실행됨

    // 메시지 전송 함수 (입력창에서 Enter 누르거나 버튼 클릭 시 실행)
    const handleSend = () => {
        // 입력값이 없거나, 클라이언트가 아직 연결 안 됐으면 아무것도 안 함
        if (!inputValue.trim() || !stompClient.current) return;
        // 보낼 메시지 객체 생성
        const newMsg = {
            date: getToday(), // 오늘 날짜
            user: '박종범',   // 사용자 이름 (실제 서비스에선 로그인 정보 사용)
            color: 'purple',  // 메시지 색상 (UI에서 사용)
            text: inputValue, // 입력한 텍스트
            channel: channel  // 채널명
        };
        // 서버로 메시지 전송 (실시간)
        stompClient.current.publish({
            destination: `/app/chat/${channel}`, // 서버의 @MessageMapping 경로와 일치해야 함
            body: JSON.stringify(newMsg)
        });
        setInputValue(''); // 입력창 비우기
    };

    // 이미지 전송 함수 (이미지 파일 선택 시 실행)
    const handleImageUpload = async (file) => {
        // 1. 이미지를 서버에 업로드 (REST API)
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('http://localhost:8089/api/chat/image', {
            method: 'POST',
            body: formData,
        });
        const imageUrl = await res.text(); // 서버에서 이미지 URL을 받아옴
        // 2. 이미지 메시지를 서버로 실시간 전송
        const newMsg = {
            date: getToday(),
            user: '박종범',
            color: 'purple',
            text: '', // 텍스트는 없음
            imageUrl: imageUrl, // 이미지 주소
            channel: channel
        };
        stompClient.current.publish({
            destination: `/app/chat/${channel}`,
            body: JSON.stringify(newMsg)
        });
    };

    // 입력창에서 Enter 키를 누르면 메시지 전송
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 기본 동작(폼 제출 등) 막기
            handleSend();
        }
    };

    // 날짜별로 메시지 묶기 (날짜별로 구분선 표시)
    const groupByDate = messages.reduce((acc, cur) => {
        acc[cur.date] = acc[cur.date] ? [...acc[cur.date], cur] : [cur];
        return acc;
    }, {});

    // 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환하는 함수
    function getToday() {
        return new Date().toISOString().slice(0, 10);
    }

    // 실제 화면(UI) 부분
    return (
        <div className="channel-chat-wrap">
            {/* 채팅방 헤더 */}
            <div className="channel-header">
                <div className="channel-title"># Channel</div>
                <div className="channel-desc">#Channel's start point.</div>
            </div>
            {/* 날짜별로 메시지 구분해서 렌더링 */}
            {Object.entries(groupByDate).map(([date, msgs]) => (
                <div key={date}>
                    <div className="chat-date-divider">{date}</div>
                    {msgs.map((msg, idx) => (
                        <div className="chat-message-row" key={idx}>
                            {/* 아바타(색상별) */}
                            <div className={`chat-avatar avatar-${msg.color}`}></div>
                            <div className="chat-message-bubble">
                                <div className="chat-message-user">{msg.user}</div>
                                <div className="chat-message-text">
                                    {/* 이미지 메시지면 이미지 표시, 아니면 텍스트 줄바꿈 처리해서 표시 */}
                                    {msg.imageUrl ? (
                                        <img src={msg.imageUrl} alt="chat-img" style={{ maxWidth: '200px' }} />
                                    ) : (
                                        msg.text.split('\n').map((line, i) => (
                                            <span key={i}>{line}<br /></span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
            {/* 입력창 + 이미지 업로드 */}
            <div className="chat-input-row">
                <input
                    className="chat-input"
                    placeholder="Send Message to #Channel"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {/* 실제 파일 업로드 input은 숨기고, 라벨을 클릭하면 파일 선택창이 뜸 */}
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        handleImageUpload(file);
                        e.target.value = ""; // 같은 파일 연속 업로드 가능하게 초기화
                    }}
                />
                <label htmlFor="image-upload" style={{ cursor: "pointer", marginLeft: 8 }}>
                    📷
                </label>
            </div>
        </div>
    );
}

export default ChattingView;
