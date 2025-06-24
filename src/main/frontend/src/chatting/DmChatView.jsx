
import React, { useState, useEffect, useRef } from 'react';
import { useDm } from '../context/DmContext';
import { useAuth } from '../context/AuthContext';
import styles from './DmChatView.module.css';

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
        <div className={styles.chat_view_container}> {/* 수정 */}
            <div className={styles.channel_header}>
                <h2 className={styles.channel_title}>{opponent.userNick}</h2>
            </div>
            <div className={styles.messages_container}> {/* 수정 */}
                {dmMessages.map((msg, index) => (
                    <div key={index} className={styles.chat_message_row}>
                        <div className={styles.chat_avatar}></div>
                        <div className={styles.chat_message_bubble}>
                            <div className={styles.chat_message_user}>{msg.user}</div>
                            <div className={styles.chat_message_text}>{msg.text}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.chat_input_row}>
                <form onSubmit={handleSendMessage} style={{display: 'flex', width: '100%'}}>
                    <input
                        className={styles.chat_input}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                    />
                    <button type="submit">전송</button>
                </form>
            </div>
        </div>
    );
};

export default DmChatView;
