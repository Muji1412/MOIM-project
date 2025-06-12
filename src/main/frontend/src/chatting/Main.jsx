import React from 'react';
import ReactDOM from 'react-dom/client';
import ChattingView from "./ChattingView";

// root 요소가 존재하는지 확인
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ChattingView />
        </React.StrictMode>
    );
}
