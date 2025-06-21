// src/main/frontend/src/components/Page/FriendPageLayout.jsx

import React from 'react';
import { useDm } from '../../context/DmContext'; // DmContext 사용
import FriendsAside from './FriendsAside';
import FriendListPage from './FriendListPage'; // 별도 컴포넌트 import
import FriendAddPage from './FriendAddPage'; // 별도 컴포넌트 import
import styles from './PageLayout.module.css';

export default function FriendPageLayout() {
    const { showAddFriend } = useDm(); // DmContext에서 상태 가져오기

    console.log('=== FriendPageLayout 렌더링 ===');
    console.log('showAddFriend:', showAddFriend);

    return (
        <div className={styles.page_container}>
            <FriendsAside />
            <main className={styles.section_container}>
                {showAddFriend ? <FriendAddPage /> : <FriendListPage />}
            </main>
        </div>
    );
}
