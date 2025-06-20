// src/main/frontend/src/components/Page/WhiteboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WhiteboardCanvas from '../whiteboard/WhiteboardCanvas';
import WhiteboardToolbar from '../whiteboard/WhiteboardToolbar';
import useWhiteboard from '../whiteboard/useWhiteboard';
import styles from '../Section/Section.module.css';

export default function WhiteboardPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('projectId');

    const [currentUser, setCurrentUser] = useState(null);

    // 사용자 정보 가져오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = sessionStorage.getItem('accessToken');
            if (!token) return;

            try {
                const response = await fetch('/api/user/my-info', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data);
                }
            } catch (error) {
                console.error('사용자 정보 로딩 중 오류:', error);
            }
        };

        fetchMyInfo();
    }, []);

    // 화이트보드 로직 (커스텀 훅 사용)
    const whiteboardProps = useWhiteboard(projectId, currentUser);

    return (
        <div className={styles.section_content}>
            <div className={styles.whiteboard_container}>
                <div className={styles.whiteboard_header}>
                    <div className={styles.whiteboard_title_area}>
                        <img src="/bundle/img/board_ic.png" alt="whiteboard" />
                        <h2>화이트보드 - {projectId}</h2>
                    </div>
                    <button
                        onClick={() => navigate(`/chat?projectId=${projectId}&channelNum=일반채팅`)}
                        className={styles.back_button}
                    >
                        ← 채팅으로 돌아가기
                    </button>
                </div>

                <WhiteboardToolbar {...whiteboardProps} />
                <WhiteboardCanvas {...whiteboardProps} />

                <div className={styles.whiteboard_users}>
                    <p>👥 현재 참여자: {whiteboardProps.getCurrentUserName()}</p>
                    {whiteboardProps.otherCursors.size > 0 && (
                        <p>+ {whiteboardProps.otherCursors.size}명이 함께 그리고 있습니다</p>
                    )}
                </div>
            </div>
        </div>
    );
}
