// src/main/frontend/src/main/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DmProvider, useDm } from '../context/DmContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 컴포넌트 임포트
import styles from '../components/Default.module.css';
import Header from "../components/Header/Header";
import NotificationComponent from "../components/Notifications";
import TestApp from "../popupTest/TestApp";
import ChattingView from "../chatting/ChattingView";
import DmChatView from '../chatting/DmChatView';

// 페이지 레이아웃 컴포넌트
import FriendPageLayout from "../components/Page/FriendPageLayout";

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
                {activeDmRoom ? <DmChatView /> : (children || <FriendPageLayout />)}
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
                style={{ zIndex: 9999 }}
            />
        </div>
    );
}

function DmRoutes() {
    return (
        <DmProvider>
            <Routes>
                {/* 친구 관련 페이지들 - 기본적으로 FriendPageLayout 렌더링 */}
                <Route path="/home" element={<MainLayout />} />
                <Route path="/friends" element={<MainLayout />} />
                <Route path="/" element={<MainLayout />} />

                {/* 다른 페이지들 */}
                <Route path="/servers" element={<MainLayout><ServerPageContent /></MainLayout>} />
                <Route path="/chat" element={<MainLayout><ChattingView /></MainLayout>} />
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
