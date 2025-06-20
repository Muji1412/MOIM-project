// src/main/frontend/src/components/whiteboard/useWhiteboard.js
import { useState, useEffect, useRef } from 'react';
import { Client as StompJs } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useWhiteboard(projectId, currentUser) {
    const canvasRef = useRef(null);
    const stompClientRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState('pen');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [otherCursors, setOtherCursors] = useState(new Map());

    const getCurrentUserId = () => {
        return currentUser?.userNo || 'anonymous';
    };

    const getCurrentUserName = () => {
        return currentUser?.userNick || '익명';
    };

    const handleRemoteDrawEvent = (event) => {
        if (event.userId === getCurrentUserId()) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        switch (event.type) {
            case 'start':
                ctx.beginPath();
                ctx.moveTo(event.x, event.y);
                break;
            case 'draw':
                ctx.lineTo(event.x, event.y);
                ctx.strokeStyle = event.color;
                ctx.lineWidth = event.tool === 'pen' ? 2 : 5;
                ctx.lineCap = 'round';
                ctx.stroke();
                break;
            case 'end':
                break;
            case 'clear':
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                break;
        }
    };

    const handleRemoteCursorEvent = (event) => {
        if (event.userId === getCurrentUserId()) return;

        setOtherCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.set(event.userId, {
                x: event.x,
                y: event.y,
                userName: event.userName,
                timestamp: event.timestamp
            });
            return newCursors;
        });

        setTimeout(() => {
            setOtherCursors(prev => {
                const newCursors = new Map(prev);
                const cursor = newCursors.get(event.userId);
                if (cursor && cursor.timestamp === event.timestamp) {
                    newCursors.delete(event.userId);
                }
                return newCursors;
            });
        }, 5000);
    };

    const sendDrawEvent = (type, x, y) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/whiteboard/${projectId}/draw`,
                body: JSON.stringify({
                    type: type,
                    x: x,
                    y: y,
                    color: currentColor,
                    tool: currentTool,
                    userId: getCurrentUserId(),
                    userName: getCurrentUserName(),
                    timestamp: Date.now()
                })
            });
        }
    };

    const sendCursorEvent = (x, y) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/whiteboard/${projectId}/cursor`,
                body: JSON.stringify({
                    x: x,
                    y: y,
                    userId: getCurrentUserId(),
                    userName: getCurrentUserName(),
                    timestamp: Date.now()
                })
            });
        }
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        sendDrawEvent('start', x, y);
    };

    const draw = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        sendCursorEvent(x, y);

        if (!isDrawing) return;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentTool === 'pen' ? 2 : 5;
        ctx.lineCap = 'round';
        ctx.stroke();

        sendDrawEvent('draw', x, y);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            sendDrawEvent('end', 0, 0);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/whiteboard/${projectId}/clear`,
                body: JSON.stringify({
                    userId: getCurrentUserId(),
                    userName: getCurrentUserName(),
                    timestamp: Date.now()
                })
            });
        }
    };

    // WebSocket 연결
    useEffect(() => {
        if (!projectId) return;

        const socket = new SockJS('http://localhost:8089/ws');
        const stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('화이트보드 WebSocket 연결됨');

                stompClient.subscribe(`/topic/whiteboard/${projectId}`, (message) => {
                    const drawEvent = JSON.parse(message.body);
                    handleRemoteDrawEvent(drawEvent);
                });

                stompClient.subscribe(`/topic/whiteboard/${projectId}/cursor`, (message) => {
                    const cursorEvent = JSON.parse(message.body);
                    handleRemoteCursorEvent(cursorEvent);
                });
            },
            onDisconnect: () => {
                console.log('화이트보드 WebSocket 연결 해제');
            }
        });

        stompClient.activate();
        stompClientRef.current = stompClient;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [projectId]);

    return {
        canvasRef,
        isDrawing,
        currentTool,
        setCurrentTool,
        currentColor,
        setCurrentColor,
        otherCursors,
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas,
        getCurrentUserId,
        getCurrentUserName
    };
}
