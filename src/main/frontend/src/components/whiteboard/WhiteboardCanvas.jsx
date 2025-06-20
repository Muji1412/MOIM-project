// src/main/frontend/src/components/whiteboard/WhiteboardCanvas.jsx
import React from 'react';
import WhiteboardCursor from './WhiteboardCursor';
import styles from './Whiteboard.module.css';

export default function WhiteboardCanvas({
                                             canvasRef,
                                             currentTool,
                                             startDrawing,
                                             draw,
                                             stopDrawing,
                                             otherCursors
                                         }) {
    return (
        <div className={styles.whiteboard_canvas_area}>
            <div style={{ position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        cursor: currentTool === 'pen' ? 'crosshair' : 'grab'
                    }}
                />

                {/* 다른 사용자들의 커서 표시 */}
                {Array.from(otherCursors.entries()).map(([userId, cursor]) => (
                    <WhiteboardCursor
                        key={userId}
                        userId={userId}
                        cursor={cursor}
                    />
                ))}
            </div>
        </div>
    );
}
