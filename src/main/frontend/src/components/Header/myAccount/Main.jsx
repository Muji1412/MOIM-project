import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import Login from "../../../user/login/login";

import MyAccount from "./myAccount";




const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <MyAccount />
    );
}