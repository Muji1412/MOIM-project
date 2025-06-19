// /src/main/frontend/src/components/Header/Header.jsx

import React, {useRef, useState, useEffect} from "react";
import {useLocation} from "react-router-dom";
import styles from "./Header.module.css";
import modalStyles from "./Modal.module.css";
import {useNavigate} from "react-router-dom";
import MyAccount from "./myAccount/myAccount.jsx";

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();

    //선택한 서버 or 채널
    const [selectedMenuItem, setSelectedMenuItem] = useState("friend");
    const [selectedChannel, setSelectedChannel] = useState("general"); // 채널 선택 상태 추가

    // 채팅방 부분 - 기본 채팅방은 삭제 불가 (최소 1개 이상 남아있어야 함)
    const [chatChannels, setChatChannels] = useState([{id: 1, name: "일반채팅", type: "chat", isDeletable: false}]);
    const [channelIdCounter, setChannelIdCounter] = useState(2);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [channelContextMenu, setChannelContextMenu] = useState({visible: false, x: 0, y: 0, channelId: null,});

    // 채팅방 ContextMenu
    const handleChannelContextMenu = (e, channelId) => {
        e.preventDefault();
        const channel = chatChannels.find(ch => ch.id === channelId);

        //기본 채팅방이거나 채팅방이 1개뿐일 때 context 메뉴는 표시 안 함
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

    //채팅방 수정
    const [isChannelModifyModalOpen, setIsChannelModifyModalOpen] = useState(false);
    const [modifyChannelData, setModifyChannelData] = useState({id: "", name: ""});
// 채팅방 수정 모달 열기
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

    // 채팅방 수정 모달 닫기
    const handleCloseChannelModifyModal = () => {
        setIsChannelModifyModalOpen(false);
        setModifyChannelData({id: "", name: ""});
    };

    // 채팅방 이름 수정 실행
    const handleModifyChannel = (e) => {
        e.preventDefault();
        if (!modifyChannelData.name.trim()) return;

        // 채팅방 목록에서 해당 채팅방 업데이트
        setChatChannels(prev =>
            prev.map(channel =>
                channel.id === modifyChannelData.id
                    ? {...channel, name: modifyChannelData.name.trim()}
                    : channel
            )
        );

        // 현재 선택된 채널이 수정된 채널인 경우 선택 상태도 업데이트
        if (selectedChannel === chatChannels.find(ch => ch.id === modifyChannelData.id)?.name) {
            setSelectedChannel(modifyChannelData.name.trim());
        }

        handleCloseChannelModifyModal();
    };


    // 채팅방 삭제
    const handleDeleteChannel = (channelId) => {
        const channel = chatChannels.find(ch => ch.id === channelId);
        //삭제 가능 여부
        if (!channel?.isDeletable || chatChannels.length <= 1) {
            alert("최소 1개의 채팅방은 유지되어야 합니다.");
            return;
        }
        // 현재 선택된 채널이 삭제될 경우 다른 채널로 변경
        if (selectedChannel === channel.name) {
            const remainingChannels = chatChannels.filter(ch => ch.id !== channelId);
            setSelectedChannel(remainingChannels[0].name);
        }

        setChatChannels(prev => prev.filter(ch => ch.id !== channelId));
        setChannelContextMenu(prev => ({...prev, visible: false}));
    };

    // 컨텍스트 메뉴 닫기
    useEffect(() => {
        const handleClick = () => {
            if (channelContextMenu.visible) {
                setChannelContextMenu(prev => ({...prev, visible: false}));
            }
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [channelContextMenu.visible]);

    //채팅방 모달
    const handleOpenChannelModal = () => {
        setIsChannelModalOpen(true);
        setNewChannelName("");
    }
    const handleCloseChannelModal = () => {
        setIsChannelModalOpen(false);
        setNewChannelName("");
    };

    //채팅방 생성
    const handleCreateChannel = (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;

        const newChannel = {
            id: channelIdCounter,
            name: newChannelName.trim(),
            type: "chat",
            isDeletable: true //사용자가 만든 채팅방은 삭제 가능
        };
        setChatChannels(prev => [...prev, newChannel]);
        setChannelIdCounter(prev => prev + 1);
        setIsChannelModalOpen(false);
        setNewChannelName("");
    }

    // 기존 상태들
    const [servers, setServers] = useState([]);
    const [selectedServerId, setSelectedServerId] = useState("default");

    // 모달 팝업
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [isAccountModifyModalOpen, setIsAccountModifyModalOpen] = useState(false);

    // --- 🎈[추가] 초대 모달 관련 상태 ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteDays, setInviteDays] = useState(7);
    const [selectedServerForInvite, setSelectedServerForInvite] = useState(null);

    // 새 서버 및 수정
    const [newServer, setNewServer] = useState({name: "", image: ""});
    const [modifyServer, setModifyServer] = useState({id: "", name: "", image: ""});

    //이미지 업로드 및 수정
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [modifyImageFile, setModifyImageFile] = useState(null);
    const [modifyImagePreview, setModifyImagePreview] = useState("");
    const inputRef = useRef();
    const modifyInputRef = useRef();
    const serverNameInputRef = useRef();
    const modifyServerNameInputRef = useRef();

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        serverId: null,
    });

    const [openChat, setOpenChat] = useState(true);
    const [openVoice, setOpenVoice] = useState(true);

    // 서버 목록 불러오기 (컴포넌트 마운트 시)
    useEffect(() => {

        const fetchServers = async () => {
            try {
                const response = await fetch('/api/groups');
                if (response.ok) {
                    const serverList = await response.json();
                    const mappedServers = serverList.map(group => ({
                        id: group.groupNo.toString(),
                        name: group.groupName,
                        image: group.groupImage || ""
                    }));
                    setServers(mappedServers);
                    console.log('매핑된 서버 목록:', mappedServers);
                } else {
                    console.error('서버 목록 불러오기 실패');
                }
            } catch (error) {
                console.error('서버 목록 불러오기 중 오류:', error);
            }
        };

        fetchServers();
    }, []);

    // 현재 경로에 따른 aside 타입 결정
    const getAsideType = () => {
        switch (location.pathname) {
            case '/':
            case '/home':
                return 'friend';
            case '/groups':
                return 'group';
            case '/settings':
                return 'settings';
            default:
                return 'friend';
        }
    };

    const asideType = getAsideType();

    // 기존 이벤트 핸들러들
    const handleServerContextMenu = (e, serverId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            serverId,
        });
    };

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible)
                setContextMenu((prev) => ({...prev, visible: false}));
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [contextMenu.visible]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setNewServer((prev) => ({...prev, image: reader.result}));
        };
        reader.readAsDataURL(file);
    };

    const handleModifyFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setModifyImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setModifyImagePreview(reader.result);
            setModifyServer((prev) => ({...prev, image: reader.result}));
        };
        reader.readAsDataURL(file);
    };


    //서버클릭시 /chat으로 넘어갈때 파라미터싣고 넘어가게..
    // 서버(홈/일반) 클릭 핸들러
    const handleServerClick = (serverId) => {
        setSelectedServerId(serverId);
        if (serverId === "default") {
            navigate("/main");
        } else {
            const selectedServer = servers.find(s => s.id === serverId);
            if (selectedServer) {
                // 예시로 channelNum=1(일반채팅) 고정, 실제로는 서버의 채널 리스트에서 선택할 것
                navigate(`/chat?projectId=${encodeURIComponent(selectedServer.name)}&channelNum=일반채팅`);
            }

        }
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        setNewServer({name: "", image: ""});
        setImageFile(null);
        setImagePreview("");
    };

    const openModifyModal = (serverId) => {
        const serverToModify = servers.find(s => s.id === serverId);
        if (serverToModify) {
            setModifyServer({
                id: serverToModify.id,
                name: serverToModify.name,
                image: serverToModify.image
            });
            setModifyImagePreview(serverToModify.image);
            setIsModifyModalOpen(true);
        }
        setContextMenu((prev) => ({...prev, visible: false}));
    };

    const closeModifyModal = () => {
        setIsModifyModalOpen(false);
        setModifyServer({id: "", name: "", image: ""});
        setModifyImageFile(null);
        setModifyImagePreview("");
    };
    // --- 🎈[추가] 초대 모달 열기 ---
    const openInviteModal = (serverId) => {
        setSelectedServerForInvite(serverId); // 어떤 서버에 대한 초대인지 ID 저장
        setIsInviteModalOpen(true);
        setContextMenu({ visible: false }); // 컨텍스트 메뉴 닫기
    };

    // --- 🎈[추가] 초대 모달 닫기 ---
    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
        setInviteLink(''); // 상태 초기화
        setInviteDays(7);
        setSelectedServerForInvite(null);
    };

    // 링크 생성 api
    const handleCreateInviteLink = async () => {
        if (!selectedServerForInvite) return;

        try {
            const response = await fetch('/api/groupsInvite/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupId: selectedServerForInvite,
                    days: inviteDays,
                }),
            });

            if (response.ok) {
                const link = await response.text();
                setInviteLink(link); // 생성된 링크를 state에 저장
            } else {
                alert('초대 링크 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('초대 링크 생성 오류:', error);
            alert('오류가 발생했습니다.');
        }
    };

    // 링크 복사 핸들링
    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('초대 링크가 복사되었습니다!');
        });
    };

    // 서버 생성 - 백엔드 API 연동
    const handleAddServer = async (e) => {
        e.preventDefault();
        if (!newServer.name.trim()) return;

        try {
            const formData = new FormData();
            formData.append('name', newServer.name);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            console.log('서버 생성 요청 시작:', newServer.name);

            const response = await fetch('/api/groups', {
                method: 'POST',
                body: formData,
            });

            console.log('응답 상태:', response.status, response.statusText);

            if (response.ok) {
                const createdGroup = await response.json();
                console.log('백엔드 응답:', createdGroup);
                const createdServer = {
                    id: createdGroup.groupNo.toString(),
                    name: createdGroup.groupName,
                    image: createdGroup.groupImage || ""
                };
                setServers((prev) => [...prev, createdServer]);
                closeModal();
                console.log('서버 생성 성공:', createdServer);
            } else {
                let errorMessage = '서버 생성에 실패했습니다.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('응답 파싱 실패:', e);
                }
                console.error('서버 생성 실패 - 상태:', response.status);
                alert(`${errorMessage} (${response.status})`);
            }
        } catch (error) {
            console.error('서버 생성 중 오류:', error);
            alert('서버 생성 중 오류가 발생했습니다.' + error.message);
        }
    };

    // 서버 정보 수정 함수
    const handleModifyServer = async (e) => {
        e.preventDefault();
        if (!modifyServer.name.trim()) return;

        try {
            const formData = new FormData();
            formData.append('name', modifyServer.name);
            if (modifyImageFile) {
                formData.append('image', modifyImageFile);
            }

            console.log('서버 수정 요청 시작:', modifyServer.name);

            const response = await fetch(`/api/groups/${modifyServer.id}`, {
                method: 'PUT',
                body: formData,
            });

            console.log('수정 응답 상태:', response.status, response.statusText);

            if (response.ok) {
                const updatedGroup = await response.json();
                console.log('백엔드 수정 응답:', updatedGroup);

                const updatedServer = {
                    id: updatedGroup.groupNo.toString(),
                    name: updatedGroup.groupName,
                    image: updatedGroup.groupImage || ""
                };

                setServers((prev) =>
                    prev.map(server =>
                        server.id === modifyServer.id ? updatedServer : server
                    )
                );
                closeModifyModal();
                console.log('서버 수정 성공:', updatedServer);
            } else {
                let errorMessage = '서버 수정에 실패했습니다.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('응답 파싱 실패:', e);
                }
                console.error('서버 수정 실패 - 상태:', response.status);
                alert(`${errorMessage} (${response.status})`);
            }
        } catch (error) {
            console.error('서버 수정 중 오류:', error);
            alert('서버 수정 중 오류가 발생했습니다: ' + error.message);
        }
    };

    // 기존 변수들
    const isFriendMenu = selectedServerId === "default";
    const selectedServer = servers.find((s) => s.id === selectedServerId);
    const selectedServerName = selectedServer ? selectedServer.name : "";

    //myAccount 모달창 켜기
    const openAccountModifyModal = () => {
        setIsAccountModifyModalOpen(true);
    }

    //myAccount 모달창 끄기
    const closeAccountModifyModal = () => {
        setIsAccountModifyModalOpen(false);
    }


    // Header 내용 렌더링
    const renderHeaderContent = () => {
        switch (asideType) {
            case 'friend':
                if (selectedServerId !== "default") {
                    return (
                        <>
                            {selectedServer && selectedServer.image ? (
                                <img
                                    src={selectedServer.image}
                                    alt="server_icon"
                                    className={styles.server_icon}
                                />
                            ) : (
                                <div className={styles.server_icon_placeholder}>
                                    <span>{selectedServerName && selectedServerName[0]}</span>
                                </div>
                            )}
                            <p>{selectedServerName}</p>
                        </>
                    );
                }
                return (
                    <>
                        <img src="/bundle/img/friend_ic_white.png" alt="friend_tab"/>
                        <p>Friend</p>
                    </>
                );
            case 'group':
                if (selectedServerId !== "default") {
                    return (
                        <>
                            {selectedServer && selectedServer.image ? (
                                <img
                                    src={selectedServer.image}
                                    alt="server_icon"
                                    className={styles.server_icon}
                                />
                            ) : (
                                <div className={styles.server_icon_placeholder}>
                                    <span>{selectedServerName && selectedServerName[0]}</span>
                                </div>
                            )}
                            <p>{selectedServerName}</p>
                        </>
                    );
                }
                return (
                    <>
                        <img src="/bundle/img/friend_ic_white.png" alt="server_tab"/>
                        <p>Servers</p>
                    </>
                );
            case 'settings':
                return (
                    <>
                        <img src="/bundle/img/setting_ic_white.png" alt="settings_tab"/>
                        <p>Settings</p>
                    </>
                );
            default:
                return (
                    <>
                        <img src="/bundle/img/friend_ic_white.png" alt="friend_tab"/>
                        <p>Friend</p>
                    </>
                );
        }
    };

    // Aside 내용 렌더링
    const renderAsideContent = () => {
        switch (asideType) {
            case 'friend':
                return (
                    <>
                        <div className={styles.server_list}>
                            <div className={styles.server_box}>
                                <div
                                    className={`${styles.list_item} ${styles.default_server} ${styles.add_server} ${selectedServerId === "default" ? styles.selected : ""}`}
                                    onClick={() => handleServerClick("default")}
                                    title="Home"
                                >
                                    <div
                                        className={`${styles.fill} ${selectedServerId === "default" ? styles.active_fill : ""}`}></div>
                                    <div
                                        className={`${styles.server_ic} ${styles.home_ic} ${selectedServerId === "default" ? styles.active_ic : ""}`}>
                                        <img src="/bundle/img/home_ic.png" alt="Home"
                                             className={selectedServerId === "default" ? styles.active_ic : ""}/>
                                    </div>
                                </div>
                                {/*<div className={styles.line}></div>*/}
                                <div className={styles.server_divider}></div>
                                {/* 생성된 서버들 */}
                                {servers.map((server) => (
                                    <div
                                        key={server.id}
                                        onContextMenu={(e) => handleServerContextMenu(e, server.id)}
                                        className={`${styles.list_item} ${selectedServerId === server.id ? styles.selected : ""}`}
                                        onClick={() => handleServerClick(server.id)}
                                        title={server.name}
                                    >
                                        <div
                                            className={`${styles.fill} ${selectedServerId === server.id ? styles.active_fill : ""}`}></div>
                                        <div
                                            className={`${styles.server_ic} ${selectedServerId === server.id ? styles.active_ic : ""}`}
                                            style={{
                                                background: !server.image
                                                    ? selectedServerId === server.id ? "#c3ee41" : "#d9d9d9"
                                                    : "transparent",
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#333",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {server.image ? (
                                                <img
                                                    src={server.image}
                                                    alt={server.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            ) : (
                                                <span>{server.name && server.name[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* 컨텍스트 메뉴 렌더링 */}
                                {contextMenu.visible && (
                                    <ul
                                        className={styles.server_context_menu}
                                        style={{
                                            top: contextMenu.y,
                                            left: contextMenu.x,
                                        }}
                                        onClick={() => setContextMenu((prev) => ({...prev, visible: false}))}
                                    >
                                        <li className={styles.context_menu_list}>
                                            <div
                                                className={styles.context_box}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModifyModal(contextMenu.serverId);
                                                }}
                                            >
                                                <span>서버 정보 변경</span>
                                            </div>
                                        </li>
                                        <li className={styles.context_menu_list}>
                                            <div
                                                className={styles.context_box}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openInviteModal(contextMenu.serverId);
                                                }}
                                            >
                                                <span>초대하기</span>
                                            </div>
                                        </li>
                                        <li className={styles.context_menu_list}>
                                            <div className={`${styles.context_box} ${styles.context_quit}`}>
                                                <span>서버 나가기</span>
                                            </div>
                                        </li>
                                    </ul>
                                )}

                                <div
                                    className={`${styles.list_item} ${styles.add_server}`}
                                    onClick={openModal}
                                    title="서버 추가"
                                >
                                    <div className={styles.server_ic}>
                                        <img src="/bundle/img/add_server_ic.png" alt="add_server"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 서버 메뉴 - 동적으로 변경 */}
                        <div className={styles.server_menu}>
                            <div className={styles.server_menu_top}>
                                {selectedServerId === "default" ? (
                                    <button className={styles.default_menu_btn}>
                                        Search or Start Talk
                                    </button>
                                ) : (
                                    <div className={styles.change_shild}>
                                        <p className={styles.server_name}>{selectedServerName}</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.server_menu_list}>
                                {selectedServerId === "default" ? (
                                    <div className={`${styles.menu_box} ${styles.selected_menu}`}>
                                        <div
                                            className={`${styles.menu_item} ${selectedMenuItem === "friend" ? styles.active_menu_item : ""}`}
                                            onClick={() => setSelectedMenuItem("friend")}
                                            style={{cursor: "pointer"}}
                                        >
                                            <img src="/bundle/img/friend_ic.png" alt="friend_ic"/>
                                            <p>Friend</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "calendar" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("calendar")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                                                <p>Calendar</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "todo" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("todo")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/todo_ic.png" alt="todo_ic"/>
                                                <p>Todo List</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "board" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("board")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/board_ic.png" alt="board_ic"/>
                                                <p>White Board</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={styles.server_menu_con}>
                                <div className={styles.menu_con_container}>
                                    {selectedServerId === "default" ? (
                                        <>
                                            <div className={styles.menu_con_title}>
                                                <p>Direct Message</p>
                                                <img src="/bundle/img/add_plus_ic.png" alt="add_something"/>
                                            </div>
                                            <div className={styles.server_menu_user_area}>
                                                <div className={styles.menu_user_box}>
                                                    <div className={styles.menu_user_list}>
                                                        <img src="#" alt="#"/>
                                                        <p>User</p>
                                                    </div>
                                                </div>
                                                <div className={styles.menu_user_box}>
                                                    <div className={styles.menu_user_list}>
                                                        <img src="#" alt="#"/>
                                                        <p>User</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="acodion_box">
                                                <div
                                                    className={styles.aco_con_title}
                                                    style={{
                                                        background: openVoice ? "" : "transparent",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    <div
                                                        className={styles.chat_box}
                                                        onClick={() => setOpenVoice((prev) => !prev)}
                                                    >
                                                        <p>voice</p>
                                                        <img
                                                            src="/bundle/img/arrow_ic.png"
                                                            alt="arrow_ic"
                                                            style={{
                                                                marginRight: 8,
                                                                transform: openVoice ? "rotate(0deg)" : "rotate(-90deg)",
                                                                transition: "transform 0.2s",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div
                                                    className={styles.channel_list}
                                                    style={{
                                                        maxHeight: openVoice ? "500px" : "0",
                                                    }}
                                                >
                                                    {openVoice && (
                                                        <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                                            <li className={styles.channel_item}>
                                                                <div
                                                                    className={`${styles.channel_item_box} ${selectedChannel === "voice" ? styles.active_channel : ""}`}
                                                                    onClick={() => setSelectedChannel("voice")}
                                                                    style={{cursor: "pointer"}}
                                                                >
                                                                    <img src="/bundle/img/voice_ic.png" alt="voice"/>
                                                                    <span>음성채팅</span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="acodion_box">
                                                <div
                                                    className={styles.aco_con_title}
                                                    style={{
                                                        background: openChat ? "" : "transparent",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    <div
                                                        className={styles.chat_box}
                                                        onClick={() => setOpenChat((prev) => !prev)}
                                                        style={{
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <p>chat</p>
                                                        <img
                                                            src="/bundle/img/arrow_ic.png"
                                                            alt="arrow_ic"
                                                            style={{
                                                                marginRight: 8,
                                                                transform: openChat ? "rotate(0deg)" : "rotate(-90deg)",
                                                                transition: "transform 0.2s",
                                                            }}
                                                        />
                                                    </div>
                                                    <img
                                                        src="/bundle/img/add_plus_ic.png"
                                                        alt="add_ic"
                                                        style={{cursor: "pointer"}}
                                                        onClick={handleOpenChannelModal}
                                                    />
                                                </div>
                                                <div
                                                    className={styles.channel_list}
                                                    style={{
                                                        maxHeight: openChat ? "500px" : "0",
                                                    }}
                                                >
                                                    {openChat && (
                                                        <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                                            {chatChannels.map((channel) => (
                                                                <li key={channel.id} className={styles.channel_item}>
                                                                    <div
                                                                        className={`${styles.channel_item_box} ${selectedChannel === channel.name ? styles.active_channel : ""}`}
                                                                        onClick={() => setSelectedChannel(channel.name)}
                                                                        onContextMenu={(e) => handleChannelContextMenu(e, channel.id)}
                                                                        style={{cursor: "pointer"}}
                                                                    >
                                                                        <img src="/bundle/img/chat_hash_ic.png"
                                                                             alt="chat"/>
                                                                        <span>{channel.name}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                            {/* 채팅방 ContextMenu */}
                                            {channelContextMenu.visible && (
                                                <ul
                                                    className={styles.channel_context_menu}
                                                    style={{
                                                        top: channelContextMenu.y,
                                                        left: channelContextMenu.x,
                                                    }}
                                                    onClick={() => setChannelContextMenu(prev => ({
                                                        ...prev,
                                                        visible: false
                                                    }))}
                                                >
                                                    <li className={styles.channel_context_box}>
                                                        <div
                                                            className={styles.channel_context_item}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenChannelModifyModal(channelContextMenu.channelId);
                                                            }}
                                                        >
                                                            <span>채팅방 이름 변경</span>
                                                        </div>
                                                    </li>

                                                    {/* 구분선 (선택사항) */}
                                                    <li className={styles.context_divider}></li>

                                                    <li className={styles.channel_context_box}>
                                                        <div
                                                            className={`${styles.channel_context_item} ${styles.channel_context_delete}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteChannel(channelContextMenu.channelId);
                                                            }}
                                                        >
                                                            <span className={styles.context_del}>채팅방 삭제</span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 'group':
                return (
                    <>
                        <div className={styles.server_list}>
                            <div className={styles.server_box}>
                                <div
                                    className={`${styles.list_item} ${styles.default_server} ${styles.add_server} ${
                                        selectedServerId === "default" ? styles.selected : ""
                                    }`}
                                    onClick={() => handleServerClick("default")}
                                    title="Home"
                                >
                                    <div
                                        className={`${styles.fill} ${selectedServerId === "default" ? styles.active_fill : ""}`}></div>
                                    <div
                                        className={`${styles.server_ic} ${styles.home_ic} ${selectedServerId === "default" ? styles.active_ic : ""}`}>
                                        <img
                                            src="/bundle/img/home_ic.png"
                                            alt="Home"
                                            className={selectedServerId === "default" ? styles.active_ic : ""}
                                        />
                                    </div>
                                </div>
                                {/*<div className={styles.line}></div>*/}
                                <div className={styles.server_divider}></div>

                                {servers.map((server) => (
                                    <div
                                        key={server.id}
                                        onContextMenu={(e) => handleServerContextMenu(e, server.id)}
                                        className={`${styles.list_item} ${selectedServerId === server.id ? styles.selected : ""}`}
                                        onClick={() => handleServerClick(server.id)}
                                        title={server.name}
                                    >
                                        <div
                                            className={`${styles.fill} ${selectedServerId === server.id ? styles.active_fill : ""}`}></div>
                                        <div
                                            className={`${styles.server_ic} ${selectedServerId === server.id ? styles.active_ic : ""}`}
                                            style={{
                                                background: !server.image
                                                    ? selectedServerId === server.id ? "#c3ee41" : "#d9d9d9"
                                                    : "transparent",
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#333",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {server.image ? (
                                                <img
                                                    src={server.image}
                                                    alt={server.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            ) : (
                                                <span>{server.name && server.name[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* 컨텍스트 메뉴 */}
                                {contextMenu.visible && (
                                    <ul
                                        className={styles.server_context_menu}
                                        style={{
                                            top: contextMenu.y,
                                            left: contextMenu.x,
                                        }}
                                        onClick={() => setContextMenu((prev) => ({...prev, visible: false}))}
                                    >
                                        <li className={styles.context_menu_list}>
                                            <div
                                                className={styles.context_box}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModifyModal(contextMenu.serverId);
                                                }}
                                            >
                                                <span>서버 정보 변경</span>
                                            </div>
                                        </li>
                                        <li className={styles.context_menu_list}>
                                            <div
                                                className={styles.context_box}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openInviteModal(contextMenu.serverId);
                                                }}
                                            >
                                                <span>초대하기</span>
                                            </div>
                                        </li>
                                        <li className={styles.context_menu_list}>
                                            <div className={`${styles.context_box} ${styles.context_quit}`}>
                                                <span>서버 나가기</span>
                                            </div>
                                        </li>
                                    </ul>
                                )}

                                <div
                                    className={`${styles.list_item} ${styles.add_server}`}
                                    onClick={openModal}
                                    title="서버 추가"
                                >
                                    <div className={styles.server_ic}>
                                        <img src="/bundle/img/add_server_ic.png" alt="add_server"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 서버용 메뉴 */}
                        <div className={styles.server_menu}>
                            <div className={styles.server_menu_top}>
                                {isFriendMenu ? (
                                    <button className={styles.default_menu_btn}>
                                        Search or Start Talk
                                    </button>
                                ) : (
                                    <div className={styles.change_shild}>
                                        <p className={styles.server_name}>{selectedServerName}</p>
                                    </div>
                                )}
                            </div>
                            <div className={styles.server_menu_list}>
                                {isFriendMenu ? (
                                    <div className={styles.menu_box}>
                                        <div className={styles.menu_item}>
                                            <img src="/bundle/img/friend_ic.png" alt="friend_ic"/>
                                            <p>Friend</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "calendar" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("calendar")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                                                <p>Calendar</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "todo" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("todo")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/todo_ic.png" alt="cal_ic"/>
                                                <p>Todo List</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "board" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("board")}
                                                style={{cursor: "pointer"}}
                                            >
                                                <img src="/bundle/img/board_ic.png" alt="cal_ic"/>
                                                <p>White Board</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className={styles.server_menu_con}>
                                <div className={styles.menu_con_container}>
                                    {isFriendMenu ? (
                                        <>
                                            <div className={styles.menu_con_title}>
                                                <p>Direct Message</p>
                                                <img src="/bundle/img/add_plus_ic.png" alt="add_something"/>
                                            </div>
                                            <div className={styles.server_menu_user_area}>
                                                <div className={styles.menu_user_box}>
                                                    <div className={styles.menu_user_list}>
                                                        <img src="#" alt="#"/>
                                                        <p>User</p>
                                                    </div>
                                                </div>
                                                <div className={styles.menu_user_box}>
                                                    <div className={styles.menu_user_list}>
                                                        <img src="#" alt="#"/>
                                                        <p>User</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="acodion_box">
                                                <div
                                                    className={styles.aco_con_title}
                                                    style={{
                                                        background: openVoice ? "" : "transparent",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    <div
                                                        className={styles.chat_box}
                                                        onClick={() => setOpenVoice((prev) => !prev)}
                                                    >
                                                        <p>voice</p>
                                                        <img
                                                            src="/bundle/img/arrow_ic.png"
                                                            alt="arrow_ic"
                                                            style={{
                                                                marginRight: 8,
                                                                transform: openVoice ? "rotate(0deg)" : "rotate(-90deg)",
                                                                transition: "transform 0.2s",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div
                                                    className={styles.channel_list}
                                                    style={{
                                                        maxHeight: openVoice ? "500px" : "0",
                                                    }}
                                                >
                                                    {openVoice && (
                                                        <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                                            <li className={styles.channel_item}>
                                                                <div
                                                                    className={`${styles.channel_item_box} ${selectedChannel === "voice" ? styles.active_channel : ""}`}
                                                                    onClick={() => setSelectedChannel("voice")}
                                                                    style={{cursor: "pointer"}}
                                                                >
                                                                    <img src="/bundle/img/voice_ic.png" alt="voice"/>
                                                                    <span>음성채팅</span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="acodion_box">
                                                <div
                                                    className={styles.aco_con_title}
                                                    style={{
                                                        background: openChat ? "" : "transparent",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    <div
                                                        className={styles.chat_box}
                                                        onClick={() => setOpenChat((prev) => !prev)}
                                                        style={{
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <p>chat</p>
                                                        <img
                                                            src="/bundle/img/arrow_ic.png"
                                                            alt="arrow_ic"
                                                            style={{
                                                                marginRight: 8,
                                                                transform: openChat ? "rotate(0deg)" : "rotate(-90deg)",
                                                                transition: "transform 0.2s",
                                                            }}
                                                        />
                                                    </div>
                                                    <img
                                                        src="/bundle/img/add_plus_ic.png"
                                                        alt="add_ic"
                                                        style={{cursor: "pointer"}}
                                                        onClick={handleOpenChannelModal}
                                                    />
                                                </div>
                                                <div
                                                    className={styles.channel_list}
                                                    style={{
                                                        maxHeight: openChat ? "500px" : "0",
                                                    }}
                                                >
                                                    {openChat && (
                                                        <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                                            {chatChannels.map((channel) => (
                                                                <li key={channel.id} className={styles.channel_item}>
                                                                    <div
                                                                        className={`${styles.channel_item_box} ${selectedChannel === channel.name ? styles.active_channel : ""}`}
                                                                        onClick={() => setSelectedChannel(channel.name)}
                                                                        onContextMenu={(e) => handleChannelContextMenu(e, channel.id)}
                                                                        style={{cursor: "pointer"}}
                                                                    >
                                                                        <img src="/bundle/img/chat_hash_ic.png"
                                                                             alt="chat"/>
                                                                        <span>{channel.name}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                            {/* 채팅방 ContextMenu */}
                                            {channelContextMenu.visible && (
                                                <ul
                                                    className={styles.channel_context_menu}
                                                    style={{
                                                        top: channelContextMenu.y,
                                                        left: channelContextMenu.x,
                                                    }}
                                                    onClick={() => setChannelContextMenu(prev => ({
                                                        ...prev,
                                                        visible: false
                                                    }))}
                                                >
                                                    <li className={styles.channel_context_box}>
                                                        <div
                                                            className={styles.channel_context_item}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenChannelModifyModal(channelContextMenu.channelId);
                                                            }}
                                                        >
                                                            <span>채팅방 이름 변경</span>
                                                        </div>
                                                    </li>

                                                    {/* 구분선 (선택사항) */}
                                                    <li className={styles.context_divider}></li>

                                                    <li className={styles.channel_context_box}>
                                                        <div className={`${styles.channel_context_item}`}
                                                             onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 handleDeleteChannel(channelContextMenu.channelId);
                                                             }}
                                                        >
                                                            <span className={styles.context_del}>채팅방 삭제</span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 'settings':
                return (
                    <>
                        <div className={styles.server_menu}>
                            <div className={styles.server_menu_top}>
                                <div className={styles.change_shild}>
                                    <p className={styles.server_name}>설정</p>
                                </div>
                            </div>
                            <div className={styles.server_menu_list}>
                                <div className={styles.menu_box}>
                                    <div className={styles.menu_item}>
                                        <img src="/bundle/img/friend_ic.png" alt="profile_ic"/>
                                        <p>프로필 설정</p>
                                    </div>
                                </div>
                                <div className={styles.menu_box}>
                                    <div className={styles.menu_item}>
                                        <img src="/bundle/img/cal_ic.png" alt="notification_ic"/>
                                        <p>알림 설정</p>
                                    </div>
                                </div>
                                <div className={styles.menu_box}>
                                    <div className={styles.menu_item}>
                                        <img src="/bundle/img/setting_ic.png" alt="privacy_ic"/>
                                        <p>개인정보 설정</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.wrap}>
            <header className={styles.header}>
                <div className={styles.hr_box}>
                    {renderHeaderContent()}
                </div>
            </header>

            <aside className={styles.aside}>
                <div className={styles.aside_container}>
                    <div className={styles.aside_box}>
                        {renderAsideContent()}
                    </div>

                    <div className={styles.aside_user_box}>
                        <div className={styles.user_box_area}>
                            <div className={styles.user_lbox}>
                                <img src="#" alt="#"/>
                                <div className={styles.mini_l_box}>
                                    <strong>User</strong>
                                    <span>UserId</span>
                                </div>
                            </div>
                            <div className={styles.user_rbox}>
                                <img src="/bundle/img/close_mic.png" alt="mic"/>
                                <img src="/bundle/img/open_head.png" alt="  head"/>
                                <img src="/bundle/img/setting_ic.png" alt="set" onClick={openAccountModifyModal}/>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 서버 생성 모달 */}
            {isModalOpen && (
                <div
                    className={modalStyles.modalOverlay}
                    onClick={closeModal}
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className={modalStyles.modal_box}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>Create New Team</span>
                            <p>Let's pioneer Teams with new people!</p>
                            <button
                                className={modalStyles.close_btn}
                                onClick={closeModal}
                                aria-label="Close"
                                type="button"
                            >
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleAddServer} className={modalStyles.modal_form}>
                            <div className={modalStyles.modal_upload_area}>
                                <label className={modalStyles.upload_label}>
                                    <img
                                        src={imagePreview ? imagePreview : "/bundle/img/upload_ic.png"}
                                        alt="upload_icon"
                                        className={modalStyles.upload_img}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={inputRef}
                                        style={{display: "none"}}
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            <div className={modalStyles.modal_input_area}>
                                <label
                                    className={modalStyles.modal_title_label}
                                    htmlFor="serverName"
                                >
                                    Server Name
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="serverName"
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="Server Name"
                                        value={newServer.name}
                                        onChange={(e) =>
                                            setNewServer({...newServer, name: e.target.value})
                                        }
                                        required
                                        ref={serverNameInputRef}
                                    />
                                </div>
                                <span className={modalStyles.guide}>
                  You can modify the server name later!
                </span>
                            </div>
                            <div className={modalStyles.modal_btn_area}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={closeModal}
                                    >
                                        Back
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>
                                        Create
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 서버 수정 모달 */}
            {isModifyModalOpen && (
                <div
                    className={modalStyles.modalOverlay}
                    onClick={closeModifyModal}
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className={modalStyles.modal_box}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>Modify Server</span>
                            <p>Update your server information!</p>
                            <button
                                className={modalStyles.close_btn}
                                onClick={closeModifyModal}
                                aria-label="Close"
                                type="button"
                            >
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleModifyServer} className={modalStyles.modal_form}>
                            <div className={modalStyles.modal_upload_area}>
                                <label className={modalStyles.upload_label}>
                                    <img
                                        src={modifyImagePreview ? modifyImagePreview : "/bundle/img/upload_ic.png"}
                                        alt="upload_icon"
                                        className={modalStyles.upload_img}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={modifyInputRef}
                                        style={{display: "none"}}
                                        onChange={handleModifyFileChange}
                                    />
                                </label>
                            </div>
                            <div className={modalStyles.modal_input_area}>
                                <label
                                    className={modalStyles.modal_title_label}
                                    htmlFor="modifyServerName"
                                >
                                    Server Name
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="modifyServerName"
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="Server Name"
                                        value={modifyServer.name}
                                        onChange={(e) =>
                                            setModifyServer({...modifyServer, name: e.target.value})
                                        }
                                        required
                                        ref={modifyServerNameInputRef}
                                    />
                                </div>
                                <span className={modalStyles.guide}>
                  Update your server information!
                </span>
                            </div>
                            <div className={modalStyles.modal_btn_area}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={closeModifyModal}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>
                                        Update
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 채팅방 생성 모달 */}
            {isChannelModalOpen && (
                <div
                    className={modalStyles.modalOverlay}
                    onClick={handleCloseChannelModal}
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className={modalStyles.modal_box}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>새 채팅방 만들기</span>
                            <p>채팅방 이름을 입력해주세요!</p>
                            <button
                                className={modalStyles.close_btn}
                                onClick={handleCloseChannelModal}
                                aria-label="Close"
                                type="button"
                            >
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel} className={modalStyles.modal_form}>
                            <div className={`${modalStyles.modal_input_area} ${modalStyles.modal_input_chat}`}>
                                <label
                                    className={modalStyles.modal_title_label}
                                    htmlFor="channelName"
                                >
                                    채팅방 이름
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="channelName"
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="채팅방 이름을 입력하세요"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <span className={modalStyles.guide}>
                        나중에 채팅방 이름을 변경할 수 있습니다!
                    </span>
                            </div>
                            <div className={`${modalStyles.modal_btn_area} ${modalStyles.modal_btn_chat}`}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={handleCloseChannelModal}
                                    >
                                        취소
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>
                                        생성
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 채팅방 수정 모달 */}
            {isChannelModifyModalOpen && (
                <div
                    className={modalStyles.modalOverlay}
                    onClick={handleCloseChannelModifyModal}
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className={modalStyles.modal_box}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>채팅방 이름 변경</span>
                            <p>새로운 채팅방 이름을 입력해주세요!</p>
                            <button
                                className={modalStyles.close_btn}
                                onClick={handleCloseChannelModifyModal}
                                aria-label="Close"
                                type="button"
                            >
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>
                        <form onSubmit={handleModifyChannel} className={modalStyles.modal_form}>
                            <div className={`${modalStyles.modal_input_area} ${modalStyles.modal_input_chat}`}>
                                <label
                                    className={modalStyles.modal_title_label}
                                    htmlFor="modifyChannelName"
                                >
                                    채팅방 이름
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="modifyChannelName"
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="새로운 채팅방 이름을 입력하세요"
                                        value={modifyChannelData.name}
                                        onChange={(e) => setModifyChannelData(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <span className={modalStyles.guide}>
                        채팅방 이름이 즉시 변경됩니다!
                    </span>
                            </div>
                            <div className={`${modalStyles.modal_btn_area} ${modalStyles.modal_btn_chat}`}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={handleCloseChannelModifyModal}
                                    >
                                        취소
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>
                                        변경
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* 🎈[추가] 서버 초대 모달 */}
            {isInviteModalOpen && (
                <div
                    className={modalStyles.modalOverlay}
                    onClick={closeInviteModal}
                >
                    <div
                        className={modalStyles.modal_box}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={modalStyles.modal_title_area}>
                            <span className={modalStyles.modal_title}>서버에 친구 초대하기</span>
                            <p>친구를 서버로 초대하여 함께 대화하세요!</p>
                            <button
                                className={modalStyles.close_btn}
                                onClick={closeInviteModal}
                                type="button"
                            >
                                <img src="/bundle/img/close_ic.png" alt="close_ic"/>
                            </button>
                        </div>

                        <div className={modalStyles.modal_form}>
                            {/* 초대 링크가 생성되었을 때 보여주는 화면 */}
                            {inviteLink ? (
                                <div className={modalStyles.modal_input_area}>
                                    <label className={modalStyles.modal_title_label}>
                                        생성된 초대 링크
                                    </label>
                                    <div className={modalStyles.modal_input_box}>
                                        <input
                                            type="text"
                                            className={modalStyles.modal_input}
                                            value={inviteLink}
                                            readOnly
                                        />
                                    </div>
                                    <span className={modalStyles.guide}>
                                        이 링크는 {inviteDays}일 후에 만료됩니다.
                                    </span>
                                </div>
                            ) : (
                                /* 링크 생성 전에 보여주는 화면 */
                                <div className={modalStyles.modal_input_area}>
                                    <label className={modalStyles.modal_title_label} htmlFor="inviteDays">
                                        초대 링크 유효 기간 (일)
                                    </label>
                                    <div className={modalStyles.modal_input_box}>
                                        <select
                                            id="inviteDays"
                                            className={modalStyles.modal_input}
                                            value={inviteDays}
                                            onChange={(e) => setInviteDays(Number(e.target.value))}
                                        >
                                            <option value="1">1일</option>
                                            <option value="3">3일</option>
                                            <option value="7">7일 (기본값)</option>
                                            <option value="30">30일</option>
                                            <option value="0">만료 없음</option>
                                        </select>
                                    </div>
                                    <span className={modalStyles.guide}>
                                       초대 링크가 유효할 기간을 선택하세요.
                                     </span>
                                </div>
                            )}


                            <div className={modalStyles.modal_btn_area}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={closeInviteModal}
                                    >
                                        닫기
                                    </button>
                                    {/* 링크 생성 전/후 버튼 다르게 표시 */}
                                    {inviteLink ? (
                                        <button type="button" className={modalStyles.createBtn} onClick={handleCopyLink}>
                                            링크 복사
                                        </button>
                                    ) : (
                                        <button type="button" className={modalStyles.createBtn} onClick={handleCreateInviteLink}>
                                            링크 생성
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/*회원정보 모달*/}
            {isAccountModifyModalOpen && (<MyAccount isOpen={isAccountModifyModalOpen}
                                                     onClose={() => {
                                                         closeAccountModifyModal();
                                                     }} />)}

        </div>
    );
}