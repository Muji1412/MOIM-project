// src/main/frontend/src/main/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext'; // AuthProvider import
import { DmProvider, useDm } from '../context/DmContext';

// 컴포넌트 임포트
import styles from '../components/Default.module.css';
import Header from "../components/Header/Header";
import Section from "../components/Section/Section";
import NotificationComponent from "../components/Notifications";
import FriendPage from "../components/Page/FriendPage";
import TestApp from "../popupTest/TestApp";
import ChattingView from "../chatting/ChattingView";
import DmChatView from '../chatting/DmChatView';
import MyCalendar from "../calendar/MyCalendar";

// --- 페이지별 컨텐츠 컴포넌트 정의 ---
function ServerPageContent() {
    return <div>서버 컨텐츠가 표시될 영역입니다.</div>;
}

function PopupMain() {
    return <NotificationComponent userId={"user1234"} />;
}

// --- 공통 레이아웃 컴포넌트 ---
function MainLayout({ children }) {
    const { activeDmRoom } = useDm();

    return (
        <div className={styles.wrap}>
            <Header />
            <div className={styles.content_container}>
                {activeDmRoom ? <DmChatView /> : children}
            </div>
        </div>
    );
}

// --- 메인 App 컴포넌트 (라우팅 설정) ---
export default function App() {
    return (
        // AuthProvider가 최상위, 그 안에 DmProvider가 위치
        <AuthProvider>
            <DmProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/home" element={<MainLayout><FriendPage /></MainLayout>} />
                        <Route path="/servers" element={<MainLayout><ServerPageContent /></MainLayout>} />
                        <Route path="/chat" element={<MainLayout><ChattingView /></MainLayout>} />
                        <Route path="/" element={<MainLayout><FriendPage /></MainLayout>} />

                        <Route path="/popup" element={<TestApp />} />
                        <Route path="/main" element={<PopupMain />} />
                    </Routes>
                </BrowserRouter>
            </DmProvider>
        </AuthProvider>

    );
}
