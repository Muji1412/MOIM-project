import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import FriendPage from './components/Page/FriendPage';
import Section from './components/Section/Section'; // Section도 라우팅 대상이 될 수 있습니다.
import styles from './components/Default.module.css';
import TestApp from "./popupTest/TestApp";
import NotificationComponent from "./components/Notifications";
import SectionContent from "./components/Section/SectionContent";

// 서버 페이지 (예시)
function ServerPage() {
    return <Section/>;
}

function PopupMain() {

    return <NotificationComponent userId={"user1234"} />;
}

export default function App() {
    return (
        <BrowserRouter>
            <div className={styles.wrap}>
                {/* Header는 항상 고정 */}
                <Header />

                {/* URL 경로에 따라 이 부분만 교체됩니다 */}
                <Routes>
                    <Route path="/home" element={<FriendPage />} />
                    {/* 예시: /servers/123 같은 동적 경로도 가능합니다. */}
                    <Route path="/servers" element={<ServerPage />} />
                    <Route path="/popup" element={<TestApp />} />
                    <Route path="/main" element={<PopupMain />} />
                    <Route path="/addfriend" element={<SectionContent />} />
                    {/*<Route path="/servers/:serverId" element={<ServerPage />} />*/}
                    {/* 기타 다른 페이지들 */}
                    {/* <Route path="/todos" element={<TodoPage />} /> */}

                    {/* 기본 경로는 친구 페이지로 설정 */}
                    <Route path="/" element={<FriendPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}