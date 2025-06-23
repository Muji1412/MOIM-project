import React from 'react';
import ServerMenuAside from './ServerMenuAside';
import ChattingView from '../../chatting/ChattingView';
import styles from './PageLayout.module.css';

export default function ServerPageLayout() {

    return (
        <div className={styles.page_container}> {/* 이 컨테이너는 flex-direction: row를 가집니다. */}

            {/* 서버메뉴어사이드 왼쪽*/}
            <ServerMenuAside />

            {/* 오른쪽 섹션: 실제 컨텐츠 */}
            {/* activeDmRoom 상태에 따라 렌더링할 컴포넌트를 결정합니다. */}
            <main className={styles.section_container}> {/* [!code focus:6] */}
                <ChattingView />
            </main>
        </div>
    );
}