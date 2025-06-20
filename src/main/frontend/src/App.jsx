import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DmProvider } from '../context/DmContext';
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


// 컴포넌트 임포트
import styles from '../components/Default.module.css';
import Header from "../components/Header/Header";
import Section from "../components/Section/Section"; // FriendPage를 포함하는 컴포넌트
import ChattingView from "../chatting/ChattingView"; // 채널 채팅 뷰
import DmChatView from '../chatting/DmChatView';     // DM 채팅 뷰
import WhiteboardPage from '../components/Page/WhiteboardPage';
import MyCalendar from "../calendar/MyCalendar";

// 공통 레이아웃 컴포넌트
function MainLayout({ children }) {
    return (
        <div className={styles.wrap}>
            <Header />
            {/* Header 아래에 컨텐츠가 표시될 영역 */}
            {children}
        </div>
    );
}

// 메인 App 컴포넌트 (라우팅 설정)
export default function App() {
    return (
        <AuthProvider>
            <DmProvider>
                <BrowserRouter>
                    <Routes>
                        {/* 기본 경로 및 친구 페이지 */}
                        <Route path="/" element={<MainLayout><Section /></MainLayout>} />
                        <Route path="/home" element={<MainLayout><Section /></MainLayout>} />

                        {/* 서버 채널 채팅 페이지 */}
                        <Route path="/chat" element={<MainLayout><ChattingView /></MainLayout>} />

                        {/* DM 채팅 페이지 */}
                        <Route path="/dm" element={<MainLayout><Section /></MainLayout>} />

                        {/* 화이트보드 페이지 */}
                        <Route path="/whiteboard" element={<MainLayout><WhiteboardPage /></MainLayout>} />

                        {/* 캘린더 페이지 */}
                        <Route path="/calendar" element={<MainLayout><MyCalendar /></MainLayout>} />

                        {/* 다른 독립적인 페이지들은 여기에 추가할 수 있습니다. */}
                        {/* 예: <Route path="/login" element={<LoginPage />} /> */}
                    </Routes>
                </BrowserRouter>
            </DmProvider>
        </AuthProvider>
    );
}

//이전꺼..
//import {BrowserRouter, Routes, Route} from 'react-router-dom';
// import Header from './components/Header/Header';
// import FriendPage from './components/Page/FriendPage';
// import Section from './components/Section/Section'; // Section도 라우팅 대상이 될 수 있습니다.
// import styles from './components/Default.module.css';
// import TestApp from "./popupTest/TestApp";
// import WhiteboardPage from './components/Page/WhiteboardPage';
// import NotificationComponent from "./components/Notifications";
// import SectionContent from "./components/Section/SectionContent";
// import React, {useState} from 'react';
// import ChattingView from "./chatting/ChattingView";
//
// // 서버 페이지 (예시)
// function ServerPage({selectedServer, selectedMenu}) {
//     return <Section
//         selectedServer={selectedServer}
//         selectedMenu={selectedMenu}
//     />;
// }
//
// function PopupMain() {
//
//     return <NotificationComponent userId={"user1234"}/>;
// }
//
// export default function App() {
//
//     // 서버, 메뉴 상태관리
//     const [selectedServer, setSelectedServer] = useState(null);
//     const [selectedMenu, setSelectedMenu] = useState('friend');
//
//     const handleServerSelect = (server) => {
//         setSelectedServer(server);
//         console.log('선택된 서버:', server);
//     };
//
//     const handleMenuSelect = (menuType) => {
//         setSelectedMenu(menuType);
//         console.log('선택된 메뉴:', menuType);
//     };
//
//     return (
//         <BrowserRouter>
//             <div className={styles.wrap}>
//                 {/* Header는 항상 고정 */}
//                 <Header
//                     onServerSelect={handleServerSelect}
//                     onMenuSelect={handleMenuSelect}
//                     selectedServer={selectedServer}
//                     selectedMenu={selectedMenu}
//                 />
//
//                 {/* URL 경로에 따라 이 부분만 교체됩니다 */}
//                 <Routes>
//                     <Route path="/home" element={<FriendPage/>}/>
//                     {/* 예시: /servers/123 같은 동적 경로도 가능합니다. */}
//                     <Route path="/servers" element={<ServerPage
//                         selectedServer={selectedServer}
//                         selectedMenu={selectedMenu}
//                     />}/>
//                     <Route path="/popup" element={<TestApp/>}/>
//                     <Route path="/main" element={<PopupMain/>}/>
//                     <Route path="/chat" element={<ChattingView/>}/>
//                     <Route path="/whiteboard" element={<WhiteboardPage/>}/>
//                     <Route path="/addfriend" element={<SectionContent/>}/>
//                     {/*<Route path="/servers/:serverId" element={<ServerPage />} />*/}
//                     {/* 기타 다른 페이지들 */}
//                     {/* <Route path="/todos" element={<TodoPage />} /> */}
//                     <Route path="/invite/:inviteCode" element={<InvitePage />} />
//
//                     {/* 기본 경로는 친구 페이지로 설정 */}
//                     <Route path="/" element={<FriendPage/>}/>
//                 </Routes>
//             </div>
//         </BrowserRouter>
//     );
// }