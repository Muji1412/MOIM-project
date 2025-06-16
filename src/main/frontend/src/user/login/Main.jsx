import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// import './Login.css';
import Login from "./Login";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <Login />
    );
}