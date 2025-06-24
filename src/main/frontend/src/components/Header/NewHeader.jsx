// NewHeader.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./NewHeader.module.css";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useServer } from '../../context/ServerContext';

export default function NewHeader() {
    const location = useLocation();

    // Context에서 가져오는 상태들
    const {
        servers,
        selectedServerId
    } = useServer();

    const { subscribeToPush, isSubscribed } = usePushNotifications();

    // 현재 유저 정보
    const [currentUser, setCurrentUser] = useState(null);

    // 현재 유저정보 가져오는 api
    useEffect(() => {
        const fetchMyInfo = async () => {
            // const token = sessionStorage.getItem('accessToken');
            //
            // if (!token) {
            //     console.log('로그인이 필요합니다.');
            //     return;
            // }

            try {
                const response = await fetch('/api/user/my-info', {
                    method: 'GET',
                    headers: {
                        // 'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data);
                    console.log('currentUser:', data);
                } else {
                    console.error('사용자 정보 로딩 실패');
                }
            } catch (error) {
                console.error('사용자 정보 로딩 중 오류:', error);
            }
        };

        fetchMyInfo();
    }, []);

    useEffect(() => {
        // currentUser 정보가 있고, 아직 푸시 구독이 되지 않은 경우에만 실행
        if (currentUser && !isSubscribed) {
            console.log('로그인 확인: 알림 권한을 확인하고 푸시 알림 구독을 시작합니다.');

            // 먼저 알림 권한을 요청하고, 허용되면 푸시 구독 시작
            requestNotificationPermission().then(hasPermission => {
                if (hasPermission) {
                    console.log('알림 권한 허용됨: 푸시 구독 시작');
                    subscribeToPush();
                } else {
                    console.log('알림 권한이 거부되어 푸시 구독을 시작할 수 없습니다.');
                }
            });
        }
    }, [currentUser, isSubscribed, subscribeToPush]);



    // 알림 권한 허용 핸들러
    // TODO 알림관련 핸들러 여기다 두는게 맞는지 생각해볼것
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            console.log("이 브라우저는 알림을 지원하지 않습니다.");
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('이미 알림 권한이 허용되어 있음');
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        console.log('알림 권한이 거부되어 있음');
        return false;
    };

    // 기존 변수들
    const selectedServer = servers.find((s) => s.id === selectedServerId);
    const selectedServerName = selectedServer ? selectedServer.name : "";

    // Header 내용 렌더링 - friend case만 유지
    // TODO 더이상 Aside의 기능은 하지 않음. friend를 띄워줄건지, 서버아이콘/서버이름을 보여줄건지에 대한 코드만 남길것

    // 현재 경로에 따른 aside 타입 결정
    const getAsideType = () => {
        switch (location.pathname) {
            case '/':
            case '/home':
                return 'friend';
            case '/groups':
                return 'group';
            case '/settings':
                return 'settings';
            default:
                return 'friend';
        }
    };

    const asideType = getAsideType();
    const renderHeaderContent = () => {
        if (asideType === 'friend') {
            if (selectedServerId !== "default") {
                return (
                    <>
                        {selectedServer && selectedServer.image ? (
                            <img
                                src={selectedServer.image}
                                alt="server_icon"
                                className={styles.server_icon}
                            />
                        ) : (
                            <div className={styles.server_icon_placeholder}>
                                <span>{selectedServerName && selectedServerName[0]}</span>
                            </div>
                        )}
                        <p>{selectedServerName}</p>
                    </>
                );
            }
            return (
                <>
                    <img className={styles.title_img} src="/bundle/img/friend_ic_white.png" alt="friend_tab"/>
                    <p>친구목록</p>
                </>
            );
        }

        // 기본값
        return (
            <>
                <img className={styles.title_img} src="/bundle/img/friend_ic_white.png" alt="friend_tab"/>
                <p>친구목록</p>
            </>
        );
    };

    return (
            <header className={styles.header}>
                <div className={styles.hr_box}>
                    {renderHeaderContent()}
                </div>
            </header>

    );
}
