// components/NotificationBell.jsx
import React from 'react';
import { useDm } from '../context/DmContext';

const NotificationBell = () => {
    const { notifications, markNotificationAsRead } = useDm();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-bell">
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>
    );
};
