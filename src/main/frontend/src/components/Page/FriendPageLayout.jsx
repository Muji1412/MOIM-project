// C:/Users/migma/Desktop/MOIM-project/src/main/frontend/src/components/Page/FriendPageLayout.jsx

import React from 'react';
import { useDm } from '../../context/DmContext';
import FriendsAside from './FriendsAside';      // 친구/DM 목록 (왼쪽)
import FriendListPage from './FriendListPage';  // 친구 목록 (오른쪽)
import FriendAddPage from './FriendAddPage';    // 친구 추가 (오른쪽)
import styles from './PageLayout.module.css';

export default function FriendPageLayout() {
    const { showAddFriend } = useDm();

    return (
        <div className={styles.page_container}> {/* 이 컨테이너는 flex-direction: row를 가집니다. */}

            {/* 왼쪽 섹션: 친구/DM 목록 */}
            <FriendsAside />

            {/* 오른쪽 섹션: 실제 컨텐츠 */}
            <main className={styles.section_container}>
                {showAddFriend ? <FriendAddPage /> : <FriendListPage />}
            </main>
        </div>
    );
}