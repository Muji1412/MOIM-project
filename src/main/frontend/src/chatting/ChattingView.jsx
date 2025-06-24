import React, {useEffect, useState, useRef} from "react";
import chatStyles from './ChattingView.module.css';

import {useLocation, useParams} from "react-router-dom";
import {useServerChat} from '../context/ServerChatContext';
import {useAuth} from '../context/AuthContext';

function ChattingView() {

    const {isConnected, sendMessage, currentServer} = useServerChat(); // Context 사용
    const {currentUser} = useAuth(); // 현재 사용자 정보 가져오기
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [serverName, setServerName] = useState("");

    // 컨텍스트 area
    const [memberContextMenu, setMemberContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        selectedMember: null
    });
// 컨텍스트 메뉴 닫기 처리
    useEffect(() => {
        const handleClick = () => {
            if (memberContextMenu.visible) {
                setMemberContextMenu(prev => ({...prev, visible: false}));
            }
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [memberContextMenu.visible]);
// 멤버 우클릭 메뉴 처리
    const handleMemberContextMenu = (e, member) => {
        e.preventDefault();

        setMemberContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            selectedMember: member,
        });
    };
// 친구추가 처리
    const handleAddFriend = async (member) => {
        try {
            // 여기에 친구추가 API 호출 로직 구현
            console.log('친구추가:', member);
            // 멤버에 찍히는거
            // id: 22
            // nickname: nick
            // username 추가했음,

            const requesterUsername = currentUser.username;
            const receiverUsername = member.username;

            const response = await fetch('/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({requesterUsername, receiverUsername})
            });

            const responseBody = await response.text();
            if (response.ok) {
                alert(responseBody);
            } else {
                alert(`요청 실패: ${responseBody}`);
            }

        } catch (error) {
            console.error('친구추가 중 오류:', error);
            alert('친구추가 중 오류가 발생했습니다.');
        }

        // TODO 종수 이거 친구추가 끝나고나면 에러 안터지게 컨텍스트 창 꺼지게 설정, 이대로 쓰면 언디파인드 터짐
        // setMemberContextMenu(prev => ({...prev, visible: false}));
    };


    // URL 파라미터 받기
    const location = useLocation();
    const params = useParams();
    const searchParams = new URLSearchParams(location.search);

    // 파라미터 추출
    const serverId = params.serverId;
    const channelName = searchParams.get("channelName") || "일반채팅";
    const groupName = serverName;

    const APPLICATION_SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:8089' : 'https://moim.o-r.kr';

    // 멤버 리스트 토글 상태 추가
    const [isMemberListVisible, setIsMemberListVisible] = useState(true);

    // 멤버 리스트 토글 함수
    const toggleMemberList = () => {
        setIsMemberListVisible(!isMemberListVisible);
    };

    // 서버 멤버 정보 가져오기 (group_no 기반)
    const [members, setMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    useEffect(() => {
        let isActive = true;

        if (serverId && serverId !== "default" && serverName) {
            setIsLoadingMembers(true);
            setMembers([]); // 이전 데이터 초기화

            fetch(`${APPLICATION_SERVER_URL}/api/groups/${serverId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (isActive) {
                        const memberList = data.map(member => ({
                            id: member.userNo || member.userId,
                            username: member.username,
                            nickname: member.nickname || member.username || member.name,
                            profileImage: member.userImg || member.profileImage,
                        }));
                        setMembers(memberList);
                        setIsLoadingMembers(false);
                    }
                })
                .catch(err => {
                    if (isActive) {
                        console.error("멤버 정보 로드 실패:", err);
                        setMembers([]);
                        setIsLoadingMembers(false);
                    }
                });
        }

        return () => {
            isActive = false;
        };
    }, [serverId, serverName, APPLICATION_SERVER_URL]);


    // 랜덤 색상 생성 함수
    const getRandomColor = () => {
        const colors = ['purple', 'blue', 'green', 'yellow'];
        return colors[Math.floor(Math.random() * colors.length)];
    };


    // 서버 정보 가져오기 (serverId로 서버명 조회)
    useEffect(() => {
        if (serverId && serverId !== "default") {
            console.log("서버 정보 로딩 시작:", serverId);

            fetch(`${APPLICATION_SERVER_URL}/api/groups/getServer/${serverId}`, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log("서버 정보 응답:", data);
                    setServerName(data.groupName);  // data.groupName으로 접근
                })
                .catch(err => {
                    console.error("서버 정보 로드 실패:", err);
                    setServerName(serverId);
                });
        }
    }, [serverId, APPLICATION_SERVER_URL]);

    // Context에서 현재 서버 정보 가져오기
    useEffect(() => {
        if (currentServer) {
            console.log("Context에서 서버 정보 받음:", currentServer);
            setServerName(currentServer.name);
        }
    }, [currentServer]);

    // 메시지 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // 날짜 포맷팅 함수
    function formatDateLabel(dateStr) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (dateStr === today) return "오늘";
        if (dateStr === yesterday) return "어제";
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("ko-KR", {month: "long", day: "numeric", weekday: "long"});
    }

    // 새 메시지 처리
    const handleNewMessage = (event) => {
        const payload = event.detail;
        if (payload.channel === channelName) {
            setMessages(prev => [...prev, payload]);
        }
    };

    // 채팅 히스토리 로드
    useEffect(() => {
        console.log("채팅 히스토리 로드 시작");
        console.log("groupName:", groupName, "channelName:", channelName);

        if (groupName && channelName) {
            setMessages([]);
            fetch(`${APPLICATION_SERVER_URL}/api/chat/${groupName}/${channelName}/all`)
                .then(res => res.json())
                .then(data => {
                    console.log("채팅 히스토리 로드 성공:", data.length, "개 메시지");
                    setMessages(data);
                })
                .catch(err => console.error("채팅 히스토리 로드 실패:", err));
        }

        window.addEventListener('newChatMessage', handleNewMessage);
        return () => {
            window.removeEventListener('newChatMessage', handleNewMessage);
        };
    }, [groupName, channelName, APPLICATION_SERVER_URL]);

    // 메시지 전송 - Context 방식으로 변경
    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Context 연결 상태 확인
        if (!isConnected) {
            alert("채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        if (!groupName) {
            console.error("그룹명이 없습니다.");
            alert("서버 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const newMsg = {
            date: new Date().toISOString(),
            user: currentUser?.userNick,
            color: 'purple',
            text: inputValue,
            channel: channelName
        };

        console.log("메시지 전송 시도:", newMsg);
        console.log("Context 연결 상태:", isConnected);
        console.log("현재 서버:", currentServer);

        // Context의 sendMessage 사용
        const success = sendMessage(`/app/chat/${groupName}`, newMsg);
        if (success) {
            setInputValue('');
            console.log("메시지 전송 완료");
        } else {
            alert("메시지 전송에 실패했습니다.");
        }
    };

    // 이미지 업로드 - Context 방식으로 변경
    const handleImageUpload = async (file) => {
        // Context 연결 상태 확인
        if (!isConnected) {
            console.error("웹소켓 연결이 없습니다.");
            alert("채팅 서버에 연결되지 않았습니다.");
            return;
        }

        if (!groupName) {
            console.error("그룹명이 없습니다.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${APPLICATION_SERVER_URL}/api/chat/image`, {
                method: 'POST',
                body: formData
            });
            const imageUrl = await res.text();

            // TODO 종범 이부분 수정필요합니다 사진 올릴때는 유저명이 아니라 박종범으로 들어갑니다
            const newMsg = {
                date: new Date().toISOString().slice(0, 10),
                user: '박종범',
                color: 'purple',
                text: '',
                imageUrl: imageUrl,
                channel: channelName
            };

            // Context의 sendMessage 사용
            const success = sendMessage(`/app/chat/${groupName}`, newMsg);
            if (!success) {
                alert("이미지 메시지 전송에 실패했습니다.");
            }
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
        }
    };

    // 파일 변경 처리
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            e.target.value = "";
        }
    };

    // 플러스 버튼 클릭
    const handlePlusClick = () => fileInputRef.current?.click();

    // 엔터키 처리
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    // Context 상태 확인 로그
    useEffect(() => {
        console.log("=== Context 상태 확인 ===");
        console.log("연결 상태:", isConnected);
        console.log("현재 서버:", currentServer);
        console.log("서버명:", serverName);
    }, [isConnected, currentServer, serverName]);

    // 날짜별 메시지 그룹화
    const groupByDate = messages.reduce((acc, msg) => {
        const date = msg.date ? msg.date.slice(0, 10) : '';
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    return (
        <section className={chatStyles.chat_view_container}>
            {/* 연결 상태 표시 (개발용) */}
            <div style={{padding: '5px', background: isConnected ? '#d4edda' : '#f8d7da', fontSize: '12px'}}>
                웹소켓 상태: {isConnected ? '연결됨' : '연결 안됨'} | 서버: {serverName || '없음'}
            </div>

            <div className={chatStyles.channel_header}>

                {/* 서버 접속 시 서버에 있는 멤버 리스트 부분 추가 */}
                <div className={chatStyles.channel_header_title}>
                    <div className={chatStyles.channel_title}># {channelName || 'Channel'}</div>

                </div>
                <div
                    className={chatStyles.channel_mem_box}
                    onClick={toggleMemberList}
                >
                    <img src="/bundle/img/mem_list_ic.png" alt="mem_list"/>
                </div>
            </div>
            {/* 서버 멤버 리스트 area 추가 */}
            <div className={chatStyles.chat_wrap_area}>
                <div className={chatStyles.chat_sub_wrap}>
                    <div className={chatStyles.messages_container}>

                        <div className={chatStyles.channel_desc}>This is the start of the
                            #{channelName || 'Channel'} channel.
                        </div>

                        {Object.entries(groupByDate).map(([date, msgs]) => (
                            <div key={date}>
                                <div className={chatStyles.chat_date_divider}>{formatDateLabel(date)}</div>
                                {msgs.map((msg, idx) => (
                                    <div className={chatStyles.chat_message_row} key={idx}>
                                        <div
                                            className={`${chatStyles.chat_avatar} ${chatStyles['avatar_' + msg.color]}`}></div>
                                        <div className={chatStyles.chat_message_bubble}>
                                            <div className={chatStyles.chat_message_user}>{msg.user}</div>
                                            {msg.text && <div className={chatStyles.chat_message_text}>{msg.text}</div>}
                                            {msg.imageUrl && (
                                                <div className={chatStyles.chat_message_image}>
                                                    <img src={msg.imageUrl} alt="uploaded" style={{
                                                        maxWidth: '300px',
                                                        maxHeight: '300px',
                                                        borderRadius: '8px'
                                                    }}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef}/>
                    </div>
                    <div className={chatStyles.chat_input_row}>
                        <button type="button" className={chatStyles.chat_plus_icon} onClick={handlePlusClick}
                                tabIndex={0}
                                aria-label="이미지 업로드">
                            <span style={{fontSize: 24, color: "#5865f2", fontWeight: 'bold'}}>+</span>
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{display: "none"}}
                               onChange={onFileChange}/>
                        <input
                            className={chatStyles.chat_input}
                            placeholder={`#${channelName || 'Channel'}에 메시지 보내기`}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>
                {/* 서버멤버 리스트를 보여 줄 부분 */}
                <div
                    className={`${chatStyles.mem_list_area} ${isMemberListVisible ? chatStyles.mem_list_visible : ''}`}>
                    <div className={chatStyles.mem_list_header}>
                        멤버 - {members.length}
                    </div>
                    <div className={chatStyles.mem_list_content}>
                        {isLoadingMembers ? (
                            <div className={chatStyles.loading_container}>
                                <div className={chatStyles.loading_message}>멤버 정보 로딩중...</div>
                            </div>
                        ) : members.length === 0 ? (
                            <div className={chatStyles.empty_message}>멤버가 없습니다</div>
                        ) : (
                            members.map(member => (
                                <div key={member.id} className={chatStyles.member_item}
                                     onContextMenu={(e) => handleMemberContextMenu(e, member)}>
                                    <div className={chatStyles.member_avatar}>
                                        {member.profileImage ? (
                                            <img
                                                src={member.profileImage}
                                                alt={member.nickname}
                                                className={chatStyles.avatar_image}
                                                onError={(e) => {
                                                    // 이미지 로드 실패 시 기본 색상 아바타로 대체
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`${chatStyles.avatar_default} ${chatStyles['avatar_' + (member.color || getRandomColor())]}`}
                                            style={{display: member.profileImage ? 'none' : 'flex'}}
                                        >
                                            {member.nickname ? member.nickname.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    </div>
                                    <span className={chatStyles.member_nickname}>{member.nickname}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 멤버 컨텍스트 메뉴 */}
                    {memberContextMenu.visible && (
                        <ul className={chatStyles.member_context_menu}
                            style={{top: memberContextMenu.y, left: memberContextMenu.x}}
                            onClick={() => setMemberContextMenu(prev => ({...prev, visible: false}))}>
                            <li className={chatStyles.member_context_box}>
                                <div
                                    className={`${chatStyles.member_context_item} ${chatStyles.member_context_default}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddFriend(memberContextMenu.selectedMember);
                                    }}>
                                    <span>친구추가</span>
                                </div>
                            </li>
                        </ul>
                    )}

                </div>
            </div>
        </section>
    );
}

export default ChattingView;
