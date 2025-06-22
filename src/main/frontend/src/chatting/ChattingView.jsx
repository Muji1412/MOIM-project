import React, { useEffect, useState, useRef } from "react";
import chatStyles from './ChattingView.module.css';
import { useLocation } from "react-router-dom";

function ChattingView() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const groupName = params.get("groupName");
    const channelName = params.get("channelName");

    const APPLICATION_SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:8089' : 'https://moim.o-r.kr';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function formatDateLabel(dateStr) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (dateStr === today) return "오늘";
        if (dateStr === yesterday) return "어제";
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    }

    const handleNewMessage = (event) => {
        const payload = event.detail;
        if (payload.channel === channelName) {
            setMessages(prev => [...prev, payload]);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const groupNameParam = params.get("groupName");
        const channelNameParam = params.get("channelName");
        if (groupNameParam && channelNameParam) {
            setMessages([]);
            fetch(`${APPLICATION_SERVER_URL}/api/chat/${groupNameParam}/${channelNameParam}/all`)
                .then(res => res.json())
                .then(data => setMessages(data))
                .catch(err => console.error("채팅 히스토리 로드 실패:", err));
        }
        window.addEventListener('newChatMessage', handleNewMessage);
        return () => {
            window.removeEventListener('newChatMessage', handleNewMessage);
        };
    }, [location.search]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        const newMsg = {
            date: new Date().toISOString(),
            user: '박종범',
            color: 'purple',
            text: inputValue,
            channel: channelName
        };
        if (window.globalStompClient && window.globalStompClient.connected) {
            window.globalStompClient.publish({
                destination: `/app/chat/${groupName}`,
                body: JSON.stringify(newMsg)
            });
            setInputValue('');
        } else {
            console.error("웹소켓 연결이 없습니다.");
        }
    };

    const handleImageUpload = async (file) => {
        if (!window.globalStompClient || !window.globalStompClient.connected) {
            console.error("웹소켓 연결이 없습니다.");
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${APPLICATION_SERVER_URL}/api/chat/image`, { method: 'POST', body: formData });
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
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            e.target.value = "";
        }
    };

    const handlePlusClick = () => fileInputRef.current?.click();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

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