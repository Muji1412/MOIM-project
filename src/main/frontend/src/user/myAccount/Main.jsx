import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import MyAccount from "./MyAccount";



const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <MyAccount />
    );
}