import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 컴포넌트 임포트 경로를 현재 파일 위치 기준으로 수정합니다.

import styles from '../components/Default.module.css';
import Header from "../components/Header/Header";
import Section from "../components/Section/Section";
import NotificationComponent from "../components/Notifications";
import FriendPage from "../components/Page/FriendPage";
import TestApp from "../popupTest/TestApp";

// --- 페이지별 컴포넌트 정의 ---

// '/servers' 경로를 위한 컴포넌트
function ServerPage() {
    return <Section />;
}

// '/main' 경로를 위한 컴포넌트
function PopupMain() {
    return <NotificationComponent userId={"user1234"} />;
}

// --- 메인 App 컴포넌트 (라우팅 설정) ---
export default function App() {
    return (
        <BrowserRouter>
            <div className={styles.wrap}>
                {/* 나중에 헤더 타입별로 바꿔지게 변경
                 function Header({ type = "default" }) {
                    if (type === "friend") {
                        return (
                            <header className={styles.friendHeader}>
                                <h1>친구 목록</h1>
                                <button>친구 추가</button>
                            </header>
                        );
                    }


                    function ServerPage() {
                        return (
                            <>
                                <Header type="server" />
                                <Section />
                            </>
                        );
                    }

                 */}

                <Header />

                {/* URL 경로에 따라 이 부분만 교체됩니다 */}
                <Routes>
                    <Route path="/home" element={<FriendPage />} />
                    <Route path="/servers" element={<ServerPage />} />
                    <Route path="/popup" element={<TestApp />} />
                    <Route path="/main" element={<PopupMain />} />
                    {/* 예시: /servers/123 같은 동적 경로도 가능 */}
                    {/* <Route path="/servers/:serverId" element={<ServerPage />} /> */}

                    {/* 기본 경로는 친구 페이지로 설정 */}
                    <Route path="/" element={<FriendPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
