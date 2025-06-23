import React, { useEffect, useState, useRef } from "react";
import chatStyles from './ChattingView.module.css';
import { useLocation, useParams } from "react-router-dom";

function ChattingView() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [serverName, setServerName] = useState("");

    // URL 파라미터 받기
    const location = useLocation();
    const params = useParams();
    const searchParams = new URLSearchParams(location.search);

    // 파라미터 추출
    const serverId = params.serverId; // /servers/:serverId에서 가져옴
    const channelName = searchParams.get("channelName"); // ?channelName=채널명에서 가져옴
    const groupName = serverName; // 서버명은 API로 가져올 예정

    const APPLICATION_SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:8089' : 'https://moim.o-r.kr';

    // 서버 정보 가져오기 (serverId로 서버명 조회)
    useEffect(() => {
        if (serverId && serverId !== "default") {
            console.log("서버 정보 로딩 시작:", serverId);

            const token = sessionStorage.getItem('accessToken');
            fetch(`${APPLICATION_SERVER_URL}/api/groups/${serverId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    console.log("서버 정보 응답:", data);
                    setServerName(data.groupName || data.name);
                })
                .catch(err => {
                    console.error("서버 정보 로드 실패:", err);
                    // 실패 시 serverId를 groupName으로 사용
                    setServerName(serverId);
                });
        }
    }, [serverId, APPLICATION_SERVER_URL]);

    // 메시지 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 날짜 포맷팅 함수
    function formatDateLabel(dateStr) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (dateStr === today) return "오늘";
        if (dateStr === yesterday) return "어제";
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    }

    // 새 메시지 처리
    const handleNewMessage = (event) => {
        const payload = event.detail;
        if (payload.channel === channelName) {
            setMessages(prev => [...prev, payload]);
        }
    };

    // 채팅 히스토리 로드
    useEffect(() => {
        console.log("채팅 히스토리 로드 시작");
        console.log("groupName:", groupName, "channelName:", channelName);

        if (groupName && channelName) {
            setMessages([]);
            fetch(`${APPLICATION_SERVER_URL}/api/chat/${groupName}/${channelName}/all`)
                .then(res => res.json())
                .then(data => {
                    console.log("채팅 히스토리 로드 성공:", data.length, "개 메시지");
                    setMessages(data);
                })
                .catch(err => console.error("채팅 히스토리 로드 실패:", err));
        }

        window.addEventListener('newChatMessage', handleNewMessage);
        return () => {
            window.removeEventListener('newChatMessage', handleNewMessage);
        };
    }, [groupName, channelName, APPLICATION_SERVER_URL]);

    // 메시지 전송
    const handleSend = () => {
        if (!inputValue.trim()) return;

        if (!groupName) {
            console.error("그룹명이 없습니다.");
            alert("서버 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const newMsg = {
            date: new Date().toISOString(),
            user: '박종범',
            color: 'purple',
            text: inputValue,
            channel: channelName
        };

        console.log("메시지 전송 시도:", newMsg);
        console.log("웹소켓 연결 상태:", window.globalStompClient?.connected);

        if (window.globalStompClient && window.globalStompClient.connected) {
            window.globalStompClient.publish({
                destination: `/app/chat/${groupName}`,
                body: JSON.stringify(newMsg)
            });
            setInputValue('');
            console.log("메시지 전송 완료");
        } else {
            console.error("웹소켓 연결이 없습니다.");
            alert("채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    // 이미지 업로드
    const handleImageUpload = async (file) => {
        if (!window.globalStompClient || !window.globalStompClient.connected) {
            console.error("웹소켓 연결이 없습니다.");
            alert("채팅 서버에 연결되지 않았습니다.");
            return;
        }

        if (!groupName) {
            console.error("그룹명이 없습니다.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${APPLICATION_SERVER_URL}/api/chat/image`, {
                method: 'POST',
                body: formData
            });
            const imageUrl = await res.text();

            const newMsg = {
                date: new Date().toISOString().slice(0, 10),
                user: '박종범',
                color: 'purple',
                text: '',
                imageUrl: imageUrl,
                channel: channelName
            };

            window.globalStompClient.publish({
                destination: `/app/chat/${groupName}`,
                body: JSON.stringify(newMsg)
            });
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
        }
    };

    // 파일 변경 처리
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            e.target.value = "";
        }
    };

    // 플러스 버튼 클릭
    const handlePlusClick = () => fileInputRef.current?.click();

    // 엔터키 처리
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    // 날짜별 메시지 그룹화
    const groupByDate = messages.reduce((acc, msg) => {
        const date = msg.date ? msg.date.slice(0, 10) : '';
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    return (
        <section className={chatStyles.chat_view_container}>
            <div className={chatStyles.channel_header}>
                <div className={chatStyles.channel_title}># {channelName || 'Channel'}</div>
                <div className={chatStyles.channel_desc}>This is the start of the #{channelName || 'Channel'} channel.</div>
            </div>
            <div className={chatStyles.messages_container}>
                {Object.entries(groupByDate).map(([date, msgs]) => (
                    <div key={date}>
                        <div className={chatStyles.chat_date_divider}>{formatDateLabel(date)}</div>
                        {msgs.map((msg, idx) => (
                            <div className={chatStyles.chat_message_row} key={idx}>
                                <div className={`${chatStyles.chat_avatar} ${chatStyles['avatar_' + msg.color]}`}></div>
                                <div className={chatStyles.chat_message_bubble}>
                                    <div className={chatStyles.chat_message_user}>{msg.user}</div>
                                    {msg.text && <div className={chatStyles.chat_message_text}>{msg.text}</div>}
                                    {msg.imageUrl && (
                                        <div className={chatStyles.chat_message_image}>
                                            <img src={msg.imageUrl} alt="uploaded" style={{maxWidth: '300px', maxHeight: '300px', borderRadius: '8px'}}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className={chatStyles.chat_input_row}>
                <button type="button" className={chatStyles.chat_plus_icon} onClick={handlePlusClick} tabIndex={0} aria-label="이미지 업로드">
                    <span style={{fontSize: 24, color: "#5865f2", fontWeight: 'bold'}}>+</span>
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} style={{display: "none"}} onChange={onFileChange}/>
                <input
                    className={chatStyles.chat_input}
                    placeholder={`#${channelName || 'Channel'}에 메시지 보내기`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </section>
    );
}

export default ChattingView;
