// src/main/frontend/src/main/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DmProvider, useDm } from '../context/DmContext';
import { ToastContainer } from 'react-toastify'; // 추가
import 'react-toastify/dist/ReactToastify.css'; // 추가

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
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                style={{ zIndex: 9999 }} // 다른 요소들 위에 표시
            />
        </div>
    );
}

function DmRoutes() {
    return (
        <DmProvider>
            <Routes>
                <Route path="/home" element={<MainLayout><FriendPage /></MainLayout>} />
                <Route path="/servers" element={<MainLayout><ServerPageContent /></MainLayout>} />
                <Route path="/chat" element={<MainLayout><ChattingView /></MainLayout>} />
                <Route path="/" element={<MainLayout><FriendPage /></MainLayout>} />
            </Routes>
        </DmProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/*" element={<DmRoutes />} />

                    <Route path="/popup" element={<TestApp />} />
                    <Route path="/main" element={<PopupMain />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
