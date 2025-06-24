

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DmProvider } from '../context/DmContext';
import { ServerProvider } from '../context/ServerContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../calendar/MyCalendar.css'
import '../calendar/AddCalendarModal.css'
import '../calendar/DetailCalendarModal.css'
import '../todoList/todoList'

import { ServerChatProvider } from '../context/ServerChatContext';

// 1. 역할이 분리된 레이아웃 컴포넌트들을 import 합니다.
import SideNav from '../components/Header/SideNav';
import NewHeader from '../components/Header/NewHeader';

// 2. 페이지 레벨의 컴포넌트들을 import 합니다.
import FriendPageLayout from "../components/Page/FriendPageLayout";

import ChattingView from "../chatting/ChattingView";
// ... 다른 페이지 컴포넌트들

// 3. 메인 레이아웃 CSS를 import 합니다.
import styles from '../components/Default.module.css';
import ServerPageLayout from "../components/Page/ServerPageLayout";
import CalendarPageLayout from "../components/Page/CalendarPageLayout";
import TodoListPageLayout from "../components/Page/TodoListPageLayout";

export default function App() {
    return (
        // 컨텍스트 프로바이더들이 최상단을 감싸도록 합니다.
        <AuthProvider>
            <ServerProvider>
                <DmProvider>
                    <ServerChatProvider>
                    <BrowserRouter>
                        {/* 전체 앱을 감싸는 컨테이너 */}
                        <div className={styles.app_container}>

                            {/* 왼쪽 고정: 서버 아이콘 목록 */}
                            <SideNav />

                            {/* 오른쪽 패널: 헤더와 컨텐츠 영역 */}
                            <div className={styles.main_panel}>

                                {/* 상단 고정: 현재 채널/친구 정보 표시 */}
                                <NewHeader />

                                {/* 컨텐츠 영역: URL 경로에 따라 페이지가 교체됨 */}
                                <main className={styles.page_content}>
                                    <Routes>
                                        <Route path="/" element={<FriendPageLayout />} />
                                        <Route path="/home" element={<FriendPageLayout />} />
                                        <Route path="/friends" element={<FriendPageLayout />} />
                                        <Route path="/todo" element={<TodoListPageLayout />} />
                                        <Route path="/calendar" element={<CalendarPageLayout />} />

                                        <Route path="/servers/:serverId" element={<ServerPageLayout />} />

                                        {/* 다른 라우트들도 이곳에 정의합니다. */}
                                    </Routes>
                                </main>
                            </div>
                        </div>
                        <ToastContainer style={{ zIndex: 99999 }}/>
                    </BrowserRouter>
                    </ServerChatProvider>
                </DmProvider>
            </ServerProvider>
        </AuthProvider>
    );
}