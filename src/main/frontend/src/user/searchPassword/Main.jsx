import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './searchPassword.css';
import SearchPassword from "./searchPassword";



const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <SearchPassword />
    );
}