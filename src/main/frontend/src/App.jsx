import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Header from './components/Header/Header';
import FriendPage from './components/Page/FriendPage';
import Section from './components/Section/Section'; // Section도 라우팅 대상이 될 수 있습니다.
import styles from './components/Default.module.css';
import TestApp from "./popupTest/TestApp";
import Whiteboard from '../whiteboard/index';
import NotificationComponent from "./components/Notifications";
import SectionContent from "./components/Section/SectionContent";
import React, {useState} from 'react';
import ChattingView from "./chatting/ChattingView";

// 서버 페이지 (예시)
function ServerPage({selectedServer, selectedMenu}) {
    return <Section
        selectedServer={selectedServer}
        selectedMenu={selectedMenu}
    />;
}

function PopupMain() {

    return <NotificationComponent userId={"user1234"}/>;
}

export default function App() {

    // 서버, 메뉴 상태관리
    const [selectedServer, setSelectedServer] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState('friend');

    const handleServerSelect = (server) => {
        setSelectedServer(server);
        console.log('선택된 서버:', server);
    };

    const handleMenuSelect = (menuType) => {
        setSelectedMenu(menuType);
        console.log('선택된 메뉴:', menuType);
    };

    return (
        <BrowserRouter>
            <div className={styles.wrap}>
                {/* Header는 항상 고정 */}
                <Header
                    onServerSelect={handleServerSelect}
                    onMenuSelect={handleMenuSelect}
                    selectedServer={selectedServer}
                    selectedMenu={selectedMenu}
                />

                {/* URL 경로에 따라 이 부분만 교체됩니다 */}
                <Routes>
                    <Route path="/home" element={<FriendPage/>}/>
                    {/* 예시: /servers/123 같은 동적 경로도 가능합니다. */}
                    <Route path="/servers" element={<ServerPage
                        selectedServer={selectedServer}
                        selectedMenu={selectedMenu}
                    />}/>
                    <Route path="/popup" element={<TestApp/>}/>
                    <Route path="/main" element={<PopupMain/>}/>
                    <Route path="/chat" element={<ChattingView/>}/>
                    <Route path="/addfriend" element={<SectionContent/>}/>
                    {/*<Route path="/servers/:serverId" element={<ServerPage />} />*/}
                    {/* 기타 다른 페이지들 */}
                    {/* <Route path="/todos" element={<TodoPage />} /> */}

                    {/* 화이트보드 경로 추가 */}
                    <Route path="/whiteboard" element={<Whiteboard/>}/>
                    <Route path="/invite/:inviteCode" element={<InvitePage />} />

                    {/* 기본 경로는 친구 페이지로 설정 */}
                    <Route path="/" element={<FriendPage/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    );
}