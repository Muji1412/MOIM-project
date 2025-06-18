import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './signup.css';
import Signup from "./signup";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <Signup />
    );
}