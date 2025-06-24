//SideNav

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SideNav.module.css";
import modalStyles from "./Modal.module.css";
import { useServer } from '../../context/ServerContext';
import { useServerChat } from '../../context/ServerChatContext';



export default function SideNav() {
    const navigate = useNavigate();
    const { connectToServer } = useServerChat()

    const {
        servers,
        setServers,
        selectedServerId,
        setSelectedServerId,
        handleServerSelect,
        setChatChannels,
        setSelectedChannel
    } = useServer();

    // 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        serverId: null,
    });

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // 서버 생성/수정 관련 상태
    const [newServer, setNewServer] = useState({name: "", image: ""});
    const [modifyServer, setModifyServer] = useState({id: "", name: "", image: ""});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [modifyImageFile, setModifyImageFile] = useState(null);
    const [modifyImagePreview, setModifyImagePreview] = useState("");

    // 초대 관련 상태
    const [inviteLink, setInviteLink] = useState('');
    const [inviteDays, setInviteDays] = useState(7);
    const [selectedServerForInvite, setSelectedServerForInvite] = useState(null);

    // 웹소켓 관련
    const stompClient = useRef(null);

    // ref들
    const inputRef = useRef();
    const modifyInputRef = useRef();
    const serverNameInputRef = useRef();
    const modifyServerNameInputRef = useRef();

    // 서버 목록 불러오기
    useEffect(() => {
        const fetchServers = async () => {
            try {
                const response = await fetch('/api/groups/user', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        // 'Authorization': `Bearer ${token}`,
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
                } else if (response.status === 401) {
                    console.error('인증 실패: 로그인이 필요합니다');
                } else {
                    console.error('서버 목록 불러오기 실패');
                }
            } catch (error) {
                console.error('서버 목록 불러오기 중 오류:', error);
            }
        };

        fetchServers();
    }, [setServers]);

    // 컨텍스트 메뉴 닫기
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible)
                setContextMenu((prev) => ({...prev, visible: false}));
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [contextMenu.visible]);

    // 서버 클릭 핸들러
    const handleServerClick = async (serverId) => {
        setSelectedServerId(serverId);

        if (serverId === "default") {
            navigate("/home");
        } else {
            const selectedServer = servers.find(s => s.id === serverId);
            if (selectedServer) {
                try {
                    console.log("서버 연결 시도:", selectedServer);
                    await connectToServer(selectedServer);
                    console.log("웹소켓 연결 완료, 페이지 이동");
                    navigate(`/servers/${serverId}`);
                } catch (error) {
                    console.error("웹소켓 연결 실패:", error);
                    alert("서버 연결에 실패했습니다. 다시 시도해주세요.");
                }
            } else {
                console.error("서버를 찾을 수 없습니다:", serverId);
            }
        }
    };


    // 서버 컨텍스트 메뉴 핸들러
    const handleServerContextMenu = (e, serverId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            serverId,
        });
    };

    // 파일 업로드 핸들러
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

    // 모달 관련 함수들
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

    const openInviteModal = (serverId) => {
        setSelectedServerForInvite(serverId);
        setIsInviteModalOpen(true);
        setContextMenu({ visible: false });
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
        setInviteLink('');
        setInviteDays(7);
        setSelectedServerForInvite(null);
    };

    // 서버 생성 함수
    const handleAddServer = async (e) => {
        e.preventDefault();
        if (!newServer.name.trim()) return;

        try {

            const formData = new FormData();
            formData.append('name', newServer.name);
            if (imageFile) {
                formData.append('image', imageFile);
            }
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const createdGroup = await response.json();

                const createdServer = {
                    id: createdGroup.groupNo.toString(),
                    name: createdGroup.groupName,
                    image: createdGroup.groupImage || ""
                };

                // 서버 생성 후 기본 "일반채팅" 채널 자동 생성
                try {
                    const channelResponse = await fetch(`/api/groups/${createdServer.id}/channels?channel_name=${encodeURIComponent('일반채팅')}`, {
                        method: 'POST',
                    });

                    if (channelResponse.ok) {
                        const defaultChannel = await channelResponse.json();

                        setSelectedServerId(createdServer.id);
                        setChatChannels([{
                            id: defaultChannel.chanNo,
                            name: defaultChannel.chanName,
                            type: "chat",
                            isDeletable: false
                        }]);
                        setSelectedChannel(defaultChannel.chanName);

                        navigate(`/chat?groupName=${encodeURIComponent(createdServer.name)}&channelName=${encodeURIComponent(defaultChannel.chanName)}`);
                    } else {
                        console.error('기본 채널 생성 실패');
                    }
                } catch (channelError) {
                    console.error('기본 채널 생성 중 오류:', channelError);
                }

                setServers((prev) => [...prev, createdServer]);
                closeModal();
                console.log('서버 생성 성공:', createdServer);
            } else if (response.status === 401) {
                alert('인증이 만료되었습니다. 다시 로그인해주세요.');
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

    // 서버 수정 함수
    const handleModifyServer = async (e) => {
        e.preventDefault();
        if (!modifyServer.name.trim()) return;

        try {

            const formData = new FormData();
            formData.append('name', modifyServer.name);
            if (modifyImageFile) {
                formData.append('image', modifyImageFile);
            }

            const response = await fetch(`/api/groups/${modifyServer.id}`, {
                method: 'PUT',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const updatedGroup = await response.json();

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
            } else if (response.status === 401) {
                alert('인증이 만료되었습니다. 다시 로그인해주세요.');
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

    // 초대 링크 생성 함수
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
                setInviteLink(link);
            } else {
                alert('초대 링크 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('초대 링크 생성 오류:', error);
            alert('오류가 발생했습니다.');
        }
    };

    // 링크 복사 함수
    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('초대 링크가 복사되었습니다!');
        });
    };

    return (
        <aside className={styles.aside}>
            <div className={styles.aside_container}>
                <div className={styles.server_list}>
                    <div className={styles.server_box}>
                        {/* 홈 버튼 */}
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
                                            ? selectedServerId === server.id ? "#c3ee41" : ""
                                            : "transparent",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        // color: "#d9d9d9",
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

                        {/* 서버 추가 버튼 */}
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
            </div>

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
                            <span className={modalStyles.modal_title}>새 서버 만들기</span>
                            <p>서버 이름과 이미지를 설정해주세요!</p>
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
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="preview"
                                                className={modalStyles.modal_img_preview}
                                            />
                                        ) : (
                                            <img src="/bundle/img/upload_ic.png" alt="upload"/>
                                        )}
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{display: "none"}}
                                    />
                                    <button
                                        type="button"
                                        className={modalStyles.modal_img_btn}
                                        onClick={() => inputRef.current?.click()}
                                    >
                                    </button>
                                </label>
                            </div>
                            <div className={modalStyles.modal_input_area}>
                                <label className={modalStyles.modal_title_label} htmlFor="serverName">
                                    서버 이름
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="serverName"
                                        ref={serverNameInputRef}
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="서버 이름을 입력하세요"
                                        value={newServer.name}
                                        onChange={(e) => setNewServer(prev => ({...prev, name: e.target.value}))}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={modalStyles.modal_btn_area}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={closeModal}
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
                            <span className={modalStyles.modal_title}>서버 정보 수정</span>
                            <p>서버 이름과 이미지를 수정해주세요!</p>
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
                            <div className={modalStyles.modal_input_area}>
                                <label className={modalStyles.modal_title_label} htmlFor="modifyServerName">
                                    서버 이름
                                </label>
                                <div className={modalStyles.modal_input_box}>
                                    <input
                                        id="modifyServerName"
                                        ref={modifyServerNameInputRef}
                                        type="text"
                                        className={modalStyles.modal_input}
                                        placeholder="서버 이름을 입력하세요"
                                        value={modifyServer.name}
                                        onChange={(e) => setModifyServer(prev => ({...prev, name: e.target.value}))}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={modalStyles.modal_input_area}>
                                <label className={modalStyles.modal_title_label}>
                                    서버 이미지
                                </label>
                                <div className={modalStyles.modal_img_area}>
                                    <div className={modalStyles.modal_img_box}>
                                        {modifyImagePreview ? (
                                            <img
                                                src={modifyImagePreview}
                                                alt="preview"
                                                className={modalStyles.modal_img_preview}
                                            />
                                        ) : (
                                            <div className={modalStyles.modal_img_placeholder}>
                                                <span>이미지 선택</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={modifyInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleModifyFileChange}
                                        style={{display: "none"}}
                                    />
                                    <button
                                        type="button"
                                        className={modalStyles.modal_img_btn}
                                        onClick={() => modifyInputRef.current?.click()}
                                    >
                                        이미지 업로드
                                    </button>
                                </div>
                            </div>
                            <div className={modalStyles.modal_btn_area}>
                                <div className={modalStyles.buttonRow}>
                                    <button
                                        type="button"
                                        className={modalStyles.backBtn}
                                        onClick={closeModifyModal}
                                    >
                                        취소
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>
                                        수정
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 서버 초대 모달 */}
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
        </aside>
    );
}
