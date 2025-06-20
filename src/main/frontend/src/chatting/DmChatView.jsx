
import React, { useState, useEffect, useRef } from 'react';
import { useDm } from '../context/DmContext';
import { useAuth } from '../context/AuthContext';
import styles from './ChattingView.module.css';

const DmChatView = () => {
    const { activeDmRoom, dmMessages, sendMessage } = useDm();
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dmMessages]);

    if (!activeDmRoom || !currentUser) {
        return <div className="chat-container">DM을 시작할 친구를 선택해주세요.</div>;
    }

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            sendMessage(message);
            setMessage('');
        }
    };

    // DTO 구조에 맞게 수정
    const opponent = activeDmRoom.user1Nick === currentUser.userNick
        ? { userNick: activeDmRoom.user2Nick, userImg: activeDmRoom.user2Img }
        : { userNick: activeDmRoom.user1Nick, userImg: activeDmRoom.user1Img };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>{opponent.userNick}</h2>
            </div>
            <div className="messages-area">
                {dmMessages.map((msg, index) => (
                    <div key={index} className={`message ${msg.user === currentUser.userNick ? 'sent' : 'received'}`}>
                        <div className="message-sender">{msg.user}</div>
                        <div className="message-content">{msg.text}</div>
                        <div className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                />
                <button type="submit">전송</button>
            </form>
        </div>
    );
};

export default DmChatView;
