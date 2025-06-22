import React from 'react';
import ServerMenuAside from './ServerMenuAside';
import ChattingView from '../../chatting/ChattingView';
import styles from './PageLayout.module.css';

export default function ServerPageLayout() {
    return (
        <div className={styles.page_container}>
            {/* 왼쪽: 서버 메뉴 */}
            <ServerMenuAside />

            {/* 오른쪽: 메인 컨텐츠 (채팅창) */}
            <main className={styles.section_container}>
                <ChattingView />
            </main>
        </div>
    );
}