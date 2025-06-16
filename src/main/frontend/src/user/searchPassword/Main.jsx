import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './SearchPassword.css';
import SearchPassword from "./SearchPassword";



const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <SearchPassword />
    );
}