import React, { createContext, useContext, useState, useRef } from 'react';

// Context 생성
const ServerContext = createContext();

// Context Provider 컴포넌트
export const ServerProvider = ({ children }) => {
    // 서버 관련 상태들
    const [servers, setServers] = useState([]);
    const [selectedServerId, setSelectedServerId] = useState("default");
    const [chatChannels, setChatChannels] = useState([
        {id: 1, name: "일반채팅", type: "chat", isDeletable: false}
    ]);
    const [selectedChannel, setSelectedChannel] = useState("general");

    // 웹소켓 관련
    const stompClient = useRef(null);

    // 서버 목록 불러오기
    const fetchServers = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch('/api/groups', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const serverList = await response.json();
                const mappedServers = serverList.map(group => ({
                    id: group.groupNo.toString(),
                    name: group.groupName,
                    image: group.groupImage || ""
                }));
                setServers(mappedServers);
            }
        } catch (error) {
            console.error('서버 목록 불러오기 중 오류:', error);
        }
    };

    // 서버 선택 핸들러
    const handleServerSelect = (serverId) => {
        setSelectedServerId(serverId);
        // 선택된 서버 정보를 다른 컴포넌트에서 사용할 수 있도록 전달
    };

    const contextValue = {
        // 상태들
        servers,
        setServers,
        selectedServerId,
        setSelectedServerId,
        chatChannels,
        setChatChannels,
        selectedChannel,
        setSelectedChannel,
        stompClient,


        // 함수들
        fetchServers,
        handleServerSelect
    };

    return (
        <ServerContext.Provider value={contextValue}>
            {children}
        </ServerContext.Provider>
    );
};

// Context 사용을 위한 커스텀 훅
export const useServer = () => {
    const context = useContext(ServerContext);
    if (!context) {
        throw new Error('useServer는 ServerProvider 내부에서 사용되어야 합니다');
    }
    return context;
};
