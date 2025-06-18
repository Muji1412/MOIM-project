import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import MyCalendar from "./MyCalendar";


const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <MyCalendar />
    );
}