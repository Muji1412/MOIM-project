// /src/main/frontend/src/Header.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header/Header'; // 실제 헤더 컴포넌트 import

// 헤더 컴포넌트에 필요한 CSS가 있다면 여기서 함께 import 해줍니다.
// import './components/Header/Header.module.css';
import './components/Header/Modal.module.css';

const headerRoot = document.getElementById('header-root');
if (headerRoot) {
    ReactDOM.createRoot(headerRoot).render(
            <Header />
    );
}