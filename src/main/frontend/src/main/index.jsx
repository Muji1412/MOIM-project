import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 기존에 사용하던 메인 컴포넌트
import './index.css';   // 전역 CSS

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);