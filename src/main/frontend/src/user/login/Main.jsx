import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// import './login.css';
import Login from "./login";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <Login />
    );
}