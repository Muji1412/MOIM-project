// src/main/frontend/src/components/whiteboard/WhiteboardCursor.jsx
import React from 'react';

export default function WhiteboardCursor({ userId, cursor }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: cursor.x,
                top: cursor.y,
                pointerEvents: 'none',
                zIndex: 1000
            }}
        >
            <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ff6b6b',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
            <div style={{
                marginTop: '5px',
                padding: '2px 6px',
                backgroundColor: '#333',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap'
            }}>
                {cursor.userName}
            </div>
        </div>
    );
}
