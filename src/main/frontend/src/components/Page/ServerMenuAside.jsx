import React, {useState, useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";
import styles from './ServerMenuAside.module.css';
import modalStyles from '../Header/Modal.module.css';
import {useServer} from "../../context/ServerContext";
import {useAuth} from "../../context/AuthContext";
import MyAccount from "../Header/myAccount/myAccount";
import AccountDeleteModal from "../Header/myAccount//AccountDelete/accountDeleteModal";
import AccountDeleteSuccessModal from "../Header/myAccount//AccountDelete/accountDeleteSuccessModal";
import ChangePasswordModal from "../Header/myAccount/ChangePassword/changePasswordModal";
import PwChangeSuccessModal from "../Header/myAccount/ChangePassword/pwChangeSuccessModal"

export default function ServerMenuAside() {


    const navigate = useNavigate();
    const {serverId} = useParams(); // 컨텍스트에서 serverId를 가져올것이므로, url에서 받아오는애는 다른이름으로 사용
    const [whichModal, setWhichModal] = useState(null);

    const {
        servers,
        selectedServerId,
        chatChannels,
        setChatChannels,
        selectedChannel,
        setSelectedChannel,
    } = useServer();

    const {currentUser} = useAuth();

    const [openVoice, setOpenVoice] = useState(true);
    const [openChat, setOpenChat] = useState(true);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [channelContextMenu, setChannelContextMenu] = useState({visible: false, x: 0, y: 0, channelId: null});
    const [isChannelModifyModalOpen, setIsChannelModifyModalOpen] = useState(false);
    const [modifyChannelData, setModifyChannelData] = useState({id: "", name: ""});
    // const [isAccountModifyModalOpen, setIsAccountModifyModalOpen] = useState(false);

    const selectedServer = servers.find((s) => s.id === selectedServerId);
    const selectedServerName = selectedServer ? selectedServer.name : "서버 선택";

    // 채널 목록 로드
    useEffect(() => {
        const fetchChannels = async () => {
            if (serverId && serverId !== "default") {
                try {
                    const response = await fetch(`/api/groups/${serverId}/channels`);
                    if (response.ok) {
                        const channels = await response.json();
                        const mappedChannels = channels.map(channel => ({
                            id: channel.chanNo,
                            name: channel.chanName,
                            type: "chat",
                            isDeletable: channel.chanName !== "일반채팅"
                        }));

                        setChatChannels(mappedChannels);

                        // URL 파라미터 확인 - 이 부분이 핵심!
                        const urlParams = new URLSearchParams(window.location.search);
                        const channelFromUrl = urlParams.get('channelName');

                        if (channelFromUrl) {
                            setSelectedChannel(channelFromUrl);
                        } else if (mappedChannels.length > 0) {
                            setSelectedChannel(mappedChannels[0].name);
                        }
                    }
                } catch (error) {
                    console.error('채널 목록 로드 중 오류:', error);
                }
            }
        };

        fetchChannels();
    }, [serverId]); //

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

    //myAccount 모달창 켜기
    const openAccountModifyModal = () => {
        //setIsAccountModifyModalOpen(true);
        setWhichModal('edit');
    }

    //myAccount 모달창 끄기
    // const closeAccountModifyModal = () => {
    //     setIsAccountModifyModalOpen(false);
    // }

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

    //캘린더로 이동시 groupNo 전달
    // 이제부터는 sideNav에서 세션에 전달하는 역할을 함으로 더이상 문제가 체크가 필요하지 않음
    const navigateToCalendar = () => {
        // if (serverId && serverId !== '') {  // Context에서 가져온 값 사용
            // console.log('navigateTo 캘린더함수 실행 성공')
            // const calData = {
            //     groupNo: serverId
            // }
            // sessionStorage.setItem('calendarData', JSON.stringify(calData));
        // } else {
        //     const groupNo = JSON.parse(sessionStorage.getItem("calendarData")).groupNo
        //     console.log('navigateTo 캘린더함수 실행 실패, 엘스문 groupNo' + groupNo)
        // }
        navigate('/calendar');
    }

    // 태원 추가, 새로고침용 세션스토리지 set 추가
    const navigateToTodo = () => {
        // if (serverId && serverId !== '') {
            // console.log('navigateToTodo 함수 실행 성공' )
            // const todoData = {
            //     groupNo: serverId
            // }
            // sessionStorage.setItem('todoData', JSON.stringify(todoData));
        // }else {
        //     const groupNo = JSON.parse(sessionStorage.getItem("todoData")).groupNo
        //     console.log('navigateTo 캘린더함수 실행 실패, 엘스문 groupNo' + groupNo)
        // }
        navigate('/todo');
    }


    // accountDelete 모달 오픈시
    const openDeleteModal = () => {
        setWhichModal('delete');
    };
    // 3단계: delete 성공 모달 오픈 (delete에서 호출)
    const openDeleteSuccessModal = () => setWhichModal('deleteSuccess');
    // 4단계: delete 성공 모달 닫히면 홈에서 로그인 페이지로 이동
    const handleDeleteSuccessClose = () => {
        setWhichModal(null);         // 모달 모두 닫기
        window.location.href = "/login.do";          // 로그인 페이지로 이동
    };

    //비밀번호 변경 성공 모달 오픈
    const openChangeModal = () => {
        setWhichModal('change');
    }
    //3단계: 비번 변경 성공 모달 오픈
    const openChangeSuccessModal = () => setWhichModal('changeSuccess');
    // 4단계: 비번 변경 성공 모달 닫히면 홈에서 로그인 페이지로 이동
    const handleChangeSuccessClose = () => {
        setWhichModal(null);
        window.location.href = "/login.do";          // 로그인 페이지로 이동
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
                    <div className={styles.menu_box} onClick={() => navigateToCalendar()}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/cal_ic.png" alt="cal_ic"/>
                            <p>캘린더</p>
                        </div>
                    </div>
                    <div className={styles.menu_box} onClick={() => navigateToTodo()}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/todo_ic.png" alt="todo_ic"/>
                            <p>Todo List</p>
                        </div>
                    </div>
                    <div className={styles.menu_box} onClick={openWhiteboardPopup}>
                        <div className={styles.menu_item} style={{cursor: "pointer"}}>
                            <img src="/bundle/img/board_ic.png" alt="board_ic"/>
                            <p>화이트보드</p>
                        </div>
                    </div>
                </div>

                <div className={styles.server_menu_con}>
                    <div className="acodion_box">
                        <div className={styles.aco_con_title}>
                            <div className={styles.chat_box} onClick={() => setOpenVoice(prev => !prev)}>
                                <p>voice</p>
                                <img src="/bundle/img/arrow_ic.png" alt="arrow"
                                     style={{
                                         transform: openVoice ? "rotate(0deg)" : "rotate(-90deg)",
                                         transition: "transform 0.2s"
                                     }}/>
                            </div>
                        </div>
                        <div className={styles.channel_list} style={{maxHeight: openVoice ? "500px" : "0"}}>
                            {openVoice && (
                                <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                    <li className={styles.channel_item}>
                                        <div
                                            className={`${styles.channel_item_box} ${selectedChannel === "voice" ? styles.active_channel : ""}`}
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
                                     style={{
                                         transform: openChat ? "rotate(0deg)" : "rotate(-90deg)",
                                         transition: "transform 0.2s"
                                     }}/>
                            </div>
                            <img src="/bundle/img/add_plus_ic.png" alt="add"
                                 style={{cursor: "pointer"}} onClick={handleOpenChannelModal}/>
                        </div>
                        <div className={styles.channel_list} style={{maxHeight: openChat ? "500px" : "0"}}>
                            {openChat && (
                                <ul style={{listStyle: "none", margin: 0, padding: 0}}>
                                    {chatChannels.map((channel) => (
                                        <li key={channel.id} className={styles.channel_item}>
                                            <div
                                                className={`${styles.channel_item_box} ${selectedChannel === channel.name ? styles.active_channel : ""}`}
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

                {/* user_profile_card_area */}
                <div className={styles.server_menu_user_profile}>
                    <div className={styles.user_box_area}>
                        <div className={styles.user_lbox}>
                            <img
                                src={currentUser?.userImg || "/bundle/img/default_profile.png"}
                                alt="user_profile"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    objectFit: "cover"
                                }}
                            />
                            <div className={styles.mini_l_box}>
                                <strong>{currentUser?.userNick || "User"}</strong>
                                <span>{currentUser?.username || "UserId"}</span>
                            </div>
                        </div>
                        <div className={styles.user_rbox}>
                            <img src="/bundle/img/setting_ic.png" alt="set" onClick={openAccountModifyModal}/>

                        </div>
                    </div>
                </div>

                {/* 채널 컨텍스트 메뉴 */}
                {channelContextMenu.visible && (
                    <ul className={styles.channel_context_menu}
                        style={{top: channelContextMenu.y, left: channelContextMenu.x}}
                        onClick={() => setChannelContextMenu(prev => ({...prev, visible: false}))}>
                        <li className={styles.channel_context_box}>
                            <div className={`${styles.channel_context_item} ${styles.channel_context_default}`}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     handleOpenChannelModifyModal(channelContextMenu.channelId);
                                 }}>
                                <span>채팅방 이름 변경</span>
                            </div>
                        </li>
                        {/*<li className={styles.context_divider}></li>*/}
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
                                    <button type="button" className={modalStyles.backBtn}
                                            onClick={handleCloseChannelModal}>취소
                                    </button>
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
                                           onChange={(e) => setModifyChannelData(prev => ({
                                               ...prev,
                                               name: e.target.value
                                           }))}
                                           required autoFocus/>
                                </div>
                                <span className={modalStyles.guide}>채팅방 이름이 즉시 변경됩니다!</span>
                            </div>
                            <div className={`${modalStyles.modal_btn_area} ${modalStyles.modal_btn_chat}`}>
                                <div className={modalStyles.buttonRow}>
                                    <button type="button" className={modalStyles.backBtn}
                                            onClick={handleCloseChannelModifyModal}>취소
                                    </button>
                                    <button type="submit" className={modalStyles.createBtn}>변경</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <MyAccount
                isOpen={whichModal === 'edit'}  // or open={whichModal === 'edit'}
                onDelete={openDeleteModal}
                onPwChange={openChangeModal}
                onClose={() => setWhichModal(null)}
            />
            {/**탈퇴(삭제) 버튼 클릭 시 호출**/}
            <AccountDeleteModal
                isOpen={whichModal === 'delete'}
                onClose={() => setWhichModal(null)}
                onDeleteSuccess={openDeleteSuccessModal} // **비밀번호 확인 후 탈퇴 성공시 호출**
            />
            <AccountDeleteSuccessModal
                isOpen={whichModal === 'deleteSuccess'}
                onClose={handleDeleteSuccessClose}   // **닫기 누르면 홈에서 로그인 이동**
            />
            <ChangePasswordModal
                isOpen={whichModal === 'change'}
                onClose={() => setWhichModal(null)}
                onChangeSuccess={openChangeSuccessModal} // **비번 변경 성공시 호출**
            />
            <PwChangeSuccessModal
                isOpen={whichModal === 'changeSuccess'}
                onClose={handleChangeSuccessClose}
            />
        </>
    );
}
