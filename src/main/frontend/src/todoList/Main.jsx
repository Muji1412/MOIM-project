import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// import './login.css';
import todoList from "./todoList";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <todoList />
    );
}