// src/main/frontend/src/components/Context/FriendContextMenu.jsx
import React, { useEffect, useRef } from 'react';
import styles from './FriendContextMenu.module.css';

const FriendContextMenu = ({ contextMenu, handleCloseContextMenu, handleDeleteFriend }) => {
    const menuRef = useRef(null);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                handleCloseContextMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleCloseContextMenu]);

    if (!contextMenu.visible) {
        return null;
    }

    const onDelete = () => {
        // handleDeleteFriend 함수는 부모 컴포넌트에서 전달받아 사용됩니다.
        handleDeleteFriend(contextMenu.friend.userNo);
        handleCloseContextMenu();
    };

    `return (
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            <ul>
                <li onClick={onDelete}>친구 삭제</li>
                <li onClick={onDelete}>친구 차단</li>
            </ul>
        </div>
    );`
};

export default FriendContextMenu;
