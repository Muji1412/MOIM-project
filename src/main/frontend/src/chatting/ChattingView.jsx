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
    // 파일 업로드 input을 제어할 ref
    const fileInputRef = useRef(null);
    // 채널명 (방 이름) - 여기서는 예시로 'general' 사용
    const channel = "general";

    useEffect(() => {
        // 1. STOMP 클라이언트 생성 (WebSocket 연결)
        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8089/ws"), // 서버 WebSocket 엔드포인트
            debug: (str) => {
                console.log("%c[STOMP]", "color: green", str);
            },
            reconnectDelay: 5000 // 연결이 끊기면 5초 후 자동 재연결
        });

        // 2. 서버와 연결이 성공하면 실행되는 함수
        client.onConnect = () => {
            client.subscribe(`/topic/chat/${channel}`, (msg) => {
                const message = JSON.parse(msg.body);
                setMessages(prev => [...prev, message]);
            });
            console.log("%c[WebSocket 연결 성공!]", "color: blue; font-weight: bold");
        };

        client.onDisconnect = () => {
            console.log("%c[WebSocket 연결 종료]", "color: orange; font-weight: bold");
        };

        client.onStompError = (frame) => {
            console.error("[WebSocket 연결 에러]", frame);
        };

        // 3. 클라이언트 활성화 (실제로 연결 시작)
        client.activate();
        stompClient.current = client;

        // 4. 과거 메시지 조회 (REST API로 오늘 날짜의 메시지 가져오기)
        fetch(`http://localhost:8089/api/chat/${channel}/${getToday()}`)
            .then(res => res.json())
            .then(data => setMessages(data));

        // 5. 컴포넌트가 사라질 때(언마운트) WebSocket 연결 해제
        return () => {
            client.deactivate();
        };
    }, [channel]);

    // 메시지 전송 함수
    const handleSend = () => {
        if (!inputValue.trim() || !stompClient.current) return;
        const newMsg = {
            date: getToday(),
            user: '박종범',
            color: 'purple',
            text: inputValue,
            channel: channel
        };
        stompClient.current.publish({
            destination: `/app/chat/${channel}`,
            body: JSON.stringify(newMsg)
        });
        setInputValue('');
    };

    // 이미지 전송 함수
    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('http://localhost:8089/api/chat/image', {
            method: 'POST',
            body: formData,
        });
        const imageUrl = await res.text();
        const newMsg = {
            date: getToday(),
            user: '박종범',
            color: 'purple',
            text: '',
            imageUrl: imageUrl,
            channel: channel
        };
        stompClient.current.publish({
            destination: `/app/chat/${channel}`,
            body: JSON.stringify(newMsg)
        });
    };

    // 파일 input이 변경되면 이미지 업로드 실행
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            e.target.value = ""; // 같은 파일 연속 업로드 가능하게 초기화
        }
    };

    // + 버튼 클릭 시 파일 업로드 input을 클릭
    const handlePlusClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 입력창에서 Enter 키를 누르면 메시지 전송
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    // 날짜별로 메시지 묶기
    const groupByDate = messages.reduce((acc, cur) => {
        acc[cur.date] = acc[cur.date] ? [...acc[cur.date], cur] : [cur];
        return acc;
    }, {});

    // 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
    function getToday() {
        return new Date().toISOString().slice(0, 10);
    }

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
                            <div className={`chat-avatar avatar-${msg.color}`}></div>
                            <div className="chat-message-bubble">
                                <div className="chat-message-user">{msg.user}</div>
                                <div className="chat-message-text">
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

            {/* 입력창 + 이미지 업로드 (+ 버튼) */}
            <div className="chat-input-row">
                <button
                    type="button"
                    className="chat-plus-icon"
                    onClick={handlePlusClick}
                    tabIndex={0}
                    aria-label="이미지 업로드"
                >
                    <span style={{ fontSize: 18, color: "#6b7280" }}>＋</span>
                </button>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={onFileChange}
                />
                <input
                    className="chat-input"
                    placeholder="Send Message to #Channel"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
}

export default ChattingView;
