import {useRef, useState, useEffect} from "react";
import {useLocation} from "react-router-dom";
import styles from "./Header.module.css";
import modalStyles from "./Modal.module.css";
import { useNavigate } from "react-router-dom";

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedMenuItem, setSelectedMenuItem] = useState("friend");
    const [selectedChannel, setSelectedChannel] = useState("general"); // 채널 선택 상태 추가


    // 기존 상태들
    const [servers, setServers] = useState([]);
    const [selectedServerId, setSelectedServerId] = useState("default");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [newServer, setNewServer] = useState({name: "", image: ""});
    const [modifyServer, setModifyServer] = useState({id: "", name: "", image: ""});
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
                                    <div className={`${styles.fill} ${selectedServerId === "default" ? styles.active_fill : ""}`}></div>
                                    <div className={`${styles.server_ic} ${styles.home_ic} ${selectedServerId === "default" ? styles.active_ic : ""}`}>
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
                                        <div className={`${styles.fill} ${selectedServerId === server.id ? styles.active_fill : ""}`}></div>
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
                                            style={{ cursor: "pointer" }}
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
                                                style={{ cursor: "pointer" }}
                                            >
                                                <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                                                <p>Calendar</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "todo" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("todo")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <img src="/bundle/img/todo_ic.png" alt="todo_ic"/>
                                                <p>Todo List</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "board" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("board")}
                                                style={{ cursor: "pointer" }}
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
                                                            <li className={styles.channel_item}>
                                                                <div
                                                                    className={`${styles.channel_item_box} ${selectedChannel === "general" ? styles.active_channel : ""}`}
                                                                    onClick={() => setSelectedChannel("general")}
                                                                    style={{ cursor: "pointer" }}
                                                                >
                                                                    <img src="/bundle/img/chat_hash_ic.png" alt="chat"/>
                                                                    <span>일반채팅</span>
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
                                                                    style={{ cursor: "pointer" }}
                                                                >
                                                                    <img src="/bundle/img/voice_ic.png" alt="voice"/>
                                                                    <span>음성채팅</span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
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
                                    <div className={`${styles.fill} ${selectedServerId === "default" ? styles.active_fill : ""}`}></div>
                                    <div className={`${styles.server_ic} ${styles.home_ic} ${selectedServerId === "default" ? styles.active_ic : ""}`}>
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
                                        <div className={`${styles.fill} ${selectedServerId === server.id ? styles.active_fill : ""}`}></div>
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
                                                style={{ cursor: "pointer" }}
                                            >
                                                <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                                                <p>Calendar</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "todo" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("todo")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <img src="/bundle/img/todo_ic.png" alt="cal_ic"/>
                                                <p>Todo List</p>
                                            </div>
                                        </div>
                                        <div className={styles.menu_box}>
                                            <div
                                                className={`${styles.menu_item} ${selectedMenuItem === "board" ? styles.active_menu_item : ""}`}
                                                onClick={() => setSelectedMenuItem("board")}
                                                style={{ cursor: "pointer" }}
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
                                                            <li className={styles.channel_item}>
                                                                <div
                                                                    className={`${styles.channel_item_box} ${selectedChannel === "general" ? styles.active_channel : ""}`}
                                                                    onClick={() => setSelectedChannel("general")}
                                                                    style={{ cursor: "pointer" }}
                                                                >
                                                                    <img src="/bundle/img/chat_hash_ic.png" alt="chat"/>
                                                                    <span>일반채팅</span>
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
                                                                    style={{ cursor: "pointer" }}
                                                                >
                                                                    <img src="/bundle/img/voice_ic.png" alt="voice"/>
                                                                    <span>음성채팅</span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
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
                                <img src="/bundle/img/setting_ic.png" alt="set"/>
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
        </div>
    );
}
