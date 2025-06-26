import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useServer } from '../../context/ServerContext';
import { useServerChat } from '../../context/ServerChatContext';
import ServerMenuAside from './ServerMenuAside';
import ChattingView from '../../chatting/ChattingView';
import styles from './PageLayout.module.css';
import {useDm} from "../../context/DmContext";

export default function ServerPageLayout() {

    //새로고침시 url 참조때문에 이렇게 선언
    const { serverId } = useParams();
    const [searchParams] = useSearchParams();
    const channelName = searchParams.get('channelName') || '일반채팅';

    const { servers, setSelectedServerId, setSelectedChannel, selectedServerId } = useServer();
    const { connectToServer, isConnected, currentServer } = useServerChat();
    const { } = useDm();


    // 서버 변경 또는 새로고침 후 자동 복원
    useEffect(() => {

        if (serverId && serverId !== "default" && servers.length > 0) {
            const serverInfo = servers.find(s => s.id === serverId);

            if (serverInfo) {
                // 현재 연결된 서버와 다른 서버로 이동하는 경우 OR 연결이 안 된 경우
                if (!isConnected || currentServer?.id !== serverId) {
                    setSelectedServerId(serverId);
                    setSelectedChannel(channelName);
                    connectToServer(serverInfo);
                } else {
                    // 채널만 업데이트
                    setSelectedChannel(channelName);
                }
            }
        }
    }, [serverId, servers.length, channelName]);

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