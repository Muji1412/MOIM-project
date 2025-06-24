import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from './ServerMenuAside.module.css';
import modalStyles from '../Header/Modal.module.css';
import { useServer } from "../../context/ServerContext";
import { useAuth } from "../../context/AuthContext";

export default function ServerMenuAside() {
    const navigate = useNavigate();
    const { serverId } = useParams();

    const {
        servers,
        selectedServerId,
        chatChannels,
        setChatChannels,
        selectedChannel,
        setSelectedChannel,
    } = useServer();

    const { currentUser } = useAuth();

    const [openVoice, setOpenVoice] = useState(true);
    const [openChat, setOpenChat] = useState(true);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [channelContextMenu, setChannelContextMenu] = useState({ visible: false, x: 0, y: 0, channelId: null });
    const [isChannelModifyModalOpen, setIsChannelModifyModalOpen] = useState(false);
    const [modifyChannelData, setModifyChannelData] = useState({ id: "", name: "" });

    const selectedServer = servers.find((s) => s.id === selectedServerId);
    const selectedServerName = selectedServer ? selectedServer.name : "서버 선택";

    // 채널 목록 로드
    useEffect(() => {
        const fetchChannels = async () => {
            if (serverId && serverId !== "default") {
                try {
                    const response = await fetch(`/api/groups/${serverId}/channels`,
                        {
                            headers: {
                                // Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`
                            }});
                    if (response.ok) {
                        const channels = await response.json();
                        const mappedChannels = channels.map(channel => ({
                            id: channel.chanNo,
                            name: channel.chanName,
                            type: "chat",
                            isDeletable: channel.chanName !== "일반채팅"
                        }));
                        setChatChannels(mappedChannels);
                        if (mappedChannels.length > 0 && !selectedChannel) {
                            setSelectedChannel(mappedChannels[0].name);
                        }
                    } else {
                        console.error('채널 목록 로드 실패');
                    }
                } catch (error) {
                    console.error('채널 목록 로드 중 오류:', error);
                }
            }
        };

        fetchChannels();
    }, [serverId, setChatChannels, selectedChannel, setSelectedChannel]);

    // 컨텍스트 메뉴 닫기 처리
    useEffect(() => {
        const handleClick = () => {
            if (channelContextMenu.visible) {
                setChannelContextMenu(prev => ({...prev, visible: false}));
            }
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [channelContextMenu.visible]);

    const handleChannelClick = (channelName) => {
        setSelectedChannel(channelName);
        if (selectedServer) {
            navigate(`/servers/${selectedServerId}?channelName=${encodeURIComponent(channelName)}`);
        }
    };

    // 채널 우클릭 메뉴 처리
    const handleChannelContextMenu = (e, channelId) => {
        e.preventDefault();
        const channel = chatChannels.find(ch => ch.id === channelId);

        // 기본 채팅방이거나 채팅방이 1개뿐일 때는 메뉴 표시 안 함
        if (!channel?.isDeletable || chatChannels.length <= 1) {
            return;
        }
        setChannelContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            channelId,
        });
    };

    const handleOpenChannelModal = () => setIsChannelModalOpen(true);
    const handleCloseChannelModal = () => {
        setIsChannelModalOpen(false);
        setNewChannelName("");
    };

    // 채널 생성
    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim() || !selectedServerId || selectedServerId === "default") return;

        try {
            const response = await fetch(`/api/groups/${selectedServerId}/channels?channel_name=${encodeURIComponent(newChannelName.trim())}`, {
                method: 'POST',
            });
            if (response.ok) {
                const createdChannelData = await response.json();
                const newChannel = {
                    id: createdChannelData.chanNo,
                    name: createdChannelData.chanName,
                    type: "chat",
                    isDeletable: true
                };
                setChatChannels(prev => [...prev, newChannel]);
                handleCloseChannelModal();
            } else {
                alert('채널 생성 실패');
            }
        } catch (error) {
            console.error('채널 생성 중 오류:', error);
        }
    };

    // 채널 수정 모달 열기
    const handleOpenChannelModifyModal = (channelId) => {
        const channelToModify = chatChannels.find(ch => ch.id === channelId);
        if (channelToModify) {
            setModifyChannelData({
                id: channelToModify.id,
                name: channelToModify.name
            });
            setIsChannelModifyModalOpen(true);
        }
        setChannelContextMenu(prev => ({...prev, visible: false}));
    };

    // 채널 수정 모달 닫기
    const handleCloseChannelModifyModal = () => {
        setIsChannelModifyModalOpen(false);
        setModifyChannelData({id: "", name: ""});
    };

    // 채널 이름 수정
    const handleModifyChannel = async (e) => {
        e.preventDefault();
        if (!modifyChannelData.name.trim()) return;

        try {
            const response = await fetch(`/api/groups/${selectedServerId}/channels/${modifyChannelData.id}/update?chanName=${encodeURIComponent(modifyChannelData.name.trim())}`, {
                method: 'POST',
            });

            if (response.ok) {
                const updatedChannel = await response.json();

                setChatChannels(prev =>
                    prev.map(channel =>
                        channel.id === modifyChannelData.id
                            ? {...channel, name: updatedChannel.chanName}
                            : channel
                    )
                );

                if (selectedChannel === chatChannels.find(ch => ch.id === modifyChannelData.id)?.name) {
                    setSelectedChannel(updatedChannel.chanName);
                }

                handleCloseChannelModifyModal();
            } else {
                alert('채널 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('채널 수정 중 오류:', error);
            alert('채널 수정 중 오류가 발생했습니다.');
        }
    };

    // 채널 삭제
    const handleDeleteChannel = async (channelId) => {
        const channel = chatChannels.find(ch => ch.id === channelId);

        if (!channel?.isDeletable || chatChannels.length <= 1) {
            alert("최소 1개의 채팅방은 유지되어야 합니다.");
            return;
        }

        try {
            const response = await fetch(`/api/groups/${selectedServerId}/channels/${channelId}/delete`, {
                method: 'POST',
            });

            if (response.ok) {
                if (selectedChannel === channel.name) {
                    const remainingChannels = chatChannels.filter(ch => ch.id !== channelId);
                    setSelectedChannel(remainingChannels[0].name);
                }

                setChatChannels(prev => prev.filter(ch => ch.id !== channelId));
                setChannelContextMenu(prev => ({...prev, visible: false}));
            } else {
                alert('채널 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('채널 삭제 중 오류:', error);
            alert('채널 삭제 중 오류가 발생했습니다.');
        }
    };

    const openVideoChatPopup = () => {
        const popupWidth = 1024;
        const popupHeight = 768;
        const videoChatData = {
            userId: currentUser.userNo,
            userName: currentUser.userNick,
            roomId: selectedServerId,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('videoChatData', JSON.stringify(videoChatData));
        const left = (window.screen.width / 2) - (popupWidth / 2);
        const top = (window.screen.height / 2) - (popupHeight / 2);
        window.open('/videocall.do', 'videoChatPopup', `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    };

    const openWhiteboardPopup = () => {
        if (!selectedServerId || selectedServerId === "default") {
            alert("먼저 서버를 선택해주세요!");
            return;
        }

        const whiteboardData = {
            roomId: `group-${selectedServerId}-whiteboard`,
            userName: currentUser?.userNick || "User",
            userId: currentUser?.userNo || "unknown",
            groupId: selectedServerId,
            timestamp: Date.now()
        };
        sessionStorage.setItem('whiteboardData', JSON.stringify(whiteboardData));
        const popupWidth = 1400;
        const popupHeight = 900;
        const left = (window.screen.width / 2) - (popupWidth / 2);
        const top = (window.screen.height / 2) - (popupHeight / 2);
        window.open('/whiteboard.do', 'whiteboardPopup', `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes`);
    };

    return (
        <>
            <aside className={styles.server_menu_aside}>
                <div className={styles.server_menu_top}>
                    <div className={styles.change_shild}>
                        <p className={styles.server_name}>{selectedServerName}</p>
                    </div>
                </div>

                <div className={styles.server_menu_list}>
                    <div className={styles.menu_box} onClick={() => navigate(`/calendar`)}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                            <p>Calendar</p>
                        </div>
                    </div>
                    <div className={styles.menu_box} onClick={() => navigate(`/todo`)}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/todo_ic.png" alt="todo_ic"/>
                            <p>Todo List</p>
                        </div>
                    </div>
                    <div className={styles.menu_box} onClick={openWhiteboardPopup}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/board_ic.png" alt="board_ic"/>
                            <p>White Board</p>
                        </div>
                    </div>
                </div>

                <div className={styles.server_menu_con}>
                    <div className="acodion_box">
                        <div className={styles.aco_con_title}>
                            <div className={styles.chat_box} onClick={() => setOpenVoice(prev => !prev)}>
                                <p>voice</p>
                                <img src="/bundle/img/arrow_ic.png" alt="arrow"
                                     style={{ transform: openVoice ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}/>
                            </div>
                        </div>
                        <div className={styles.channel_list} style={{ maxHeight: openVoice ? "500px" : "0" }}>
                            {openVoice && (
                                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                    <li className={styles.channel_item}>
                                        <div className={`${styles.channel_item_box} ${selectedChannel === "voice" ? styles.active_channel : ""}`}
                                             onClick={openVideoChatPopup} style={{cursor: "pointer"}}>
                                            <img src="/bundle/img/voice_ic.png" alt="voice"/>
                                            <span>화상채팅</span>
                                        </div>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="acodion_box">
                        <div className={styles.aco_con_title}>
                            <div className={styles.chat_box} onClick={() => setOpenChat(prev => !prev)}>
                                <p>chat</p>
                                <img src="/bundle/img/arrow_ic.png" alt="arrow"
                                     style={{ transform: openChat ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}/>
                            </div>
                            <img src="/bundle/img/add_plus_ic.png" alt="add"
                                 style={{cursor: "pointer"}} onClick={handleOpenChannelModal} />
                        </div>
                        <div className={styles.channel_list} style={{ maxHeight: openChat ? "500px" : "0" }}>
                            {openChat && (
                                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                    {chatChannels.map((channel) => (
                                        <li key={channel.id} className={styles.channel_item}>
                                            <div className={`${styles.channel_item_box} ${selectedChannel === channel.name ? styles.active_channel : ""}`}
                                                 onClick={() => handleChannelClick(channel.name)}
                                                 onContextMenu={(e) => handleChannelContextMenu(e, channel.id)}
                                                 style={{cursor: "pointer"}}>
                                                <img src="/bundle/img/chat_hash_ic.png" alt="chat"/>
                                                <span>{channel.name}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* 채널 컨텍스트 메뉴 */}
                {channelContextMenu.visible && (
                    <ul className={styles.channel_context_menu}
                        style={{ top: channelContextMenu.y, left: channelContextMenu.x }}
                        onClick={() => setChannelContextMenu(prev => ({...prev, visible: false}))}>
                        <li className={styles.channel_context_box}>
                            <div className={styles.channel_context_item}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     handleOpenChannelModifyModal(channelContextMenu.channelId);
                                 }}>
                                <span>채팅방 이름 변경</span>
                            </div>
                        </li>
                        <li className={styles.context_divider}></li>
                        <li className={styles.channel_context_box}>
                            <div className={`${styles.channel_context_item} ${styles.channel_context_delete}`}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteChannel(channelContextMenu.channelId);
                                 }}>
                                <span className={styles.context_del}>채팅방 삭제</span>
                            </div>
                        </li>
                    </ul>
                )}
            </aside>

            {/* 채널 생성 모달 */}
            {isChannelModalOpen && (
                <div className={modalStyles.modalOverlay} onClick={handleCloseChannelModal}>
                    <div className={modalStyles.modal_box} onClick={(e) => e.stopPropagation()}>
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>새 채팅방 만들기</span>
                            <p>채팅방 이름을 입력해주세요!</p>
                            <button className={modalStyles.close_btn} onClick={handleCloseChannelModal}>
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel} className={modalStyles.modal_form}>
                            <div className={`${modalStyles.modal_input_area} ${modalStyles.modal_input_chat}`}>
                                <label className={modalStyles.modal_title_label}>채팅방 이름</label>
                                <div className={modalStyles.modal_input_box}>
                                    <input type="text" className={modalStyles.modal_input}
                                           placeholder="채팅방 이름을 입력하세요"
                                           value={newChannelName}
                                           onChange={(e) => setNewChannelName(e.target.value)}
                                           required autoFocus/>
                                </div>
                                <span className={modalStyles.guide}>나중에 채팅방 이름을 변경할 수 있습니다!</span>
                            </div>
                            <div className={`${modalStyles.modal_btn_area} ${modalStyles.modal_btn_chat}`}>
                                <div className={modalStyles.buttonRow}>
                                    <button type="button" className={modalStyles.backBtn} onClick={handleCloseChannelModal}>취소</button>
                                    <button type="submit" className={modalStyles.createBtn}>생성</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 채널 수정 모달 */}
            {isChannelModifyModalOpen && (
                <div className={modalStyles.modalOverlay} onClick={handleCloseChannelModifyModal}>
                    <div className={modalStyles.modal_box} onClick={(e) => e.stopPropagation()}>
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>채팅방 이름 변경</span>
                            <p>새로운 채팅방 이름을 입력해주세요!</p>
                            <button className={modalStyles.close_btn} onClick={handleCloseChannelModifyModal}>
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleModifyChannel} className={modalStyles.modal_form}>
                            <div className={`${modalStyles.modal_input_area} ${modalStyles.modal_input_chat}`}>
                                <label className={modalStyles.modal_title_label}>채팅방 이름</label>
                                <div className={modalStyles.modal_input_box}>
                                    <input type="text" className={modalStyles.modal_input}
                                           placeholder="새로운 채팅방 이름을 입력하세요"
                                           value={modifyChannelData.name}
                                           onChange={(e) => setModifyChannelData(prev => ({...prev, name: e.target.value}))}
                                           required autoFocus/>
                                </div>
                                <span className={modalStyles.guide}>채팅방 이름이 즉시 변경됩니다!</span>
                            </div>
                            <div className={`${modalStyles.modal_btn_area} ${modalStyles.modal_btn_chat}`}>
                                <div className={modalStyles.buttonRow}>
                                    <button type="button" className={modalStyles.backBtn} onClick={handleCloseChannelModifyModal}>취소</button>
                                    <button type="submit" className={modalStyles.createBtn}>변경</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
