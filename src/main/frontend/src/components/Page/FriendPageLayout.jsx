// C:/Users/migma/Desktop/MOIM-project/src/main/frontend/src/components/Page/FriendPageLayout.jsx

import React from 'react';
import { useDm } from '../../context/DmContext';
import FriendsAside from './FriendsAside';      // 친구/DM 목록 (왼쪽)
import FriendListPage from './FriendListPage';  // 친구 목록 (오른쪽)
import FriendAddPage from './FriendAddPage';    // 친구 추가 (오른쪽)
import DmChatView from '../../chatting/DmChatView'; // DM 채팅방 컴포넌트를 import 합니다. [!code ++]
import styles from './PageLayout.module.css';

export default function FriendPageLayout() {
    // DmContext에서 showAddFriend와 함께 activeDmRoom 상태를 가져옵니다. [!code focus]
    const { showAddFriend, activeDmRoom } = useDm();

    return (
        <div className={styles.page_container}> {/* 이 컨테이너는 flex-direction: row를 가집니다. */}

            {/* 왼쪽 섹션: 친구/DM 목록 */}
            <FriendsAside />

            {/* 오른쪽 섹션: 실제 컨텐츠 */}
            {/* activeDmRoom 상태에 따라 렌더링할 컴포넌트를 결정합니다. */}
            <main className={styles.section_container}> {/* [!code focus:6] */}
                {activeDmRoom ? (
                    <DmChatView />
                ) : showAddFriend ? (
                    <FriendAddPage />
                ) : (
                    <FriendListPage />
                )}
            </main>
        </div>
    );
}