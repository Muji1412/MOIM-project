import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './Signup.css';
import Signup from "./Signup";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <Signup />
    );
}