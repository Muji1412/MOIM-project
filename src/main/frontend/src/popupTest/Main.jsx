import React, { useEffect } from 'react'; // useEffect를 import에 추가
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../components/Notifications";
import './popupTest.css';

// 이 컴포넌트는 페이지의 시작점이므로 여기에 로직을 추가합니다.
function PopupMain() {

    return <NotificationComponent userId={"user1234"} />;
}


// root 요소가 존재하는지 확인
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <PopupMain /> // 새로 만든 PopupMain 컴포넌트를 렌더링합니다.
    );
}

