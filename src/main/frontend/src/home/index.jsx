import React from 'react';
import ReactDOM from 'react-dom/client';
import FriendPage from '../components/Page/FriendPage';

const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
            <FriendPage />
    );
}