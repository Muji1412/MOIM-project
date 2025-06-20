// src/main/frontend/src/components/Section/SectionContent.jsx


import React, { useState, useEffect } from 'react';
import styles from './Section.module.css';
import FriendContextMenu from "../Context/FriendContextMenu";
import { useDm } from "../../context/DmContext";

const SectionContent = ({ showAddFriend, onBackToList }) => {

    // 친구 관리 상태들만 유지
    const [friendId, setFriendId] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState({
        visible: false, x: 0, y: 0, friend: null,
    });


    // 친구 관리 useEffect들
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                console.log('로그인이 필요합니다.');
                return;
            }
            try {
                const response = await fetch('/api/user/my-info', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data);
                } else {
                    console.error('사용자 정보 로딩 실패');
                }
            } catch (error) {
                console.error('사용자 정보 로딩 중 오류:', error);
            }
        };

        fetchMyInfo();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        if (showAddFriend) {
            fetchPendingRequests();
        } else {
            fetchFriends();
        }
    }, [showAddFriend, currentUser]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, friend: null });
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [contextMenu.visible]);


    // 친구 관리 함수들
    const filteredFriends = friendsList.filter(friend =>
        friend.userNick.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartDm = (e, friend) => {
        e.stopPropagation();
        console.log('=== DM 시작 클릭 ===');
        console.log('friend 데이터:', friend);
        console.log('selectDmRoom 함수:', selectDmRoom);

        // friend 객체가 올바른 구조인지 확인
        const dmTarget = {
            userNick: friend.userNick,
            userNo: friend.userNo,
            userImg: friend.userImg
        };

        console.log('DM 대상:', dmTarget); // 디버깅용
        selectDmRoom(dmTarget);
    };

    const handleFriendContextMenu = (e, friend) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, friend: friend });
    };

    const fetchFriends = async () => {
        const token = sessionStorage.getItem('accessToken');
        if (!token || !currentUser) return;

        try {
            const response = await fetch('/api/friendship/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({userId: currentUser.userNo})
            });

            if (response.ok) {
                const data = await response.json();
                setFriendsList(data);
            } else {
                setFriendsList([]);
            }
        } catch (error) {
            console.error('친구 목록 로딩 중 오류:', error);
            setFriendsList([]);
        }
    };

    const fetchPendingRequests = async () => {
        const token = sessionStorage.getItem('accessToken');
        if (!token || !currentUser) return;

        try {
            const response = await fetch('/api/friendship/pending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({userId: currentUser.userNo})
            });

            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data);
            } else {
                setPendingRequests([]);
            }
        } catch (error) {
            console.error('친구 요청 중 오류:', error);
            setPendingRequests([]);
        }
    };

    const handleRequestSubmit = async (event) => {
        event.preventDefault();

        if (!currentUser || !friendId.trim()) return;

        const requesterUsername = currentUser.username;
        const receiverUsername = friendId.trim();
        const token = sessionStorage.getItem('accessToken');

        try {
            const response = await fetch('/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({requesterUsername, receiverUsername})
            });

            const responseBody = await response.text();
            if (response.ok) {
                alert(responseBody);
                fetchPendingRequests();
            } else {
                alert(`요청 실패: ${responseBody}`);
            }
        } catch (error) {
            console.error('친구 요청 중 오류 발생:', error);
        } finally {
            setFriendId('');
        }
    };

    const handleAcceptRequest = async (request) => {
        const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch(`/api/friendship/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userA: request.friendshipUserA,
                    userB: request.friendshipUserB
                })
            });
            if (response.ok) {
                alert('친구 요청이 수락되었습니다.');
                fetchPendingRequests();
                fetchFriends();
            } else {
                alert('친구 요청 수락에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 수락 중 오류:', error);
        }
    };

    const handleCancelRequest = async (request) => {
        const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch(`/api/friendship/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userA: request.friendshipUserA,
                    userB: request.friendshipUserB
                })
            });
            if (response.ok) {
                alert('친구 요청이 취소되었습니다.');
                fetchPendingRequests();
            } else {
                alert('요청 취소에 실패했습니다.');
            }
        } catch (error) {
            console.error('요청 취소 중 오류:', error);
        }
    };

    const handleDeleteFriend = async (friend) => {
        if (!friend || !window.confirm(`'${friend.userNick}'님을 친구 목록에서 삭제하시겠습니까?`)) {
            return;
        }
        const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch('/api/friendship/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userA: friend.friendshipUserA,
                    userB: friend.friendshipUserB,
                }),
            });
            if (response.ok) {
                alert('친구가 삭제되었습니다.');
                fetchFriends();
            } else {
                alert('친구 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 삭제 중 오류:', error);
        }
    };

    const handleBlockFriend = async (friend) => {
        if (!friend || !window.confirm(`'${friend.userNick}'님을 차단하시겠습니까?`)) {
            return;
        }

        const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch('/api/friendship/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userA: friend.friendshipUserA,
                    userB: friend.friendshipUserB,
                }),
            });
            if (response.ok) {
                alert('친구가 차단되었습니다.');
                fetchFriends();
            } else {
                alert('친구 차단에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 차단 중 오류:', error);
        }
    };


    // 친구 추가 화면
    if (showAddFriend) {
        return (
            <div className={styles.section_content}>
                <div className={styles.add_friend_area}>
                    <div className={styles.add_friend_container}>
                        <div className={styles.add_friend_search_box}>
                            <div className={styles.add_friend_search_bar}>
                                <form onSubmit={handleRequestSubmit}>
                                    <input
                                        className={styles.afs_bar}
                                        placeholder="Search by User ID (e.g. 2)"
                                        type="text"
                                        value={friendId}
                                        onChange={(e) => setFriendId(e.target.value)}
                                    />
                                    <button className={styles.afs_btn} type="submit">
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.pending_requests_area}>
                    <div className={styles.pending_requests_container}>
                        <div className={styles.pending_requests_title}>
                            <p className={styles.pending_main_title}>친구추가 요청</p>
                            <p className={styles.pending_sub_title}>
                                친구 요청을 받은 목록입니다. ({pendingRequests.length}개)
                            </p>
                        </div>
                        <div className={styles.pending_list_container}>
                            {pendingRequests.length === 0 ? (
                                <div className={styles.no_pending_message}>
                                    <p>받은 친구 요청이 없습니다.</p>
                                </div>
                            ) : (
                                pendingRequests.map((request) => (
                                    <div key={request.userNo} className={styles.pending_item}>
                                        <div className={styles.pending_user_info}>
                                            <div className={styles.pending_profile_area}>
                                                <img
                                                    src={request.userImg || "/bundle/img/default_profile.png"}
                                                    alt="profile"
                                                    className={styles.pending_profile_img}
                                                />
                                                <div className={styles.pending_user_details}>
                                                    <p className={styles.pending_username}>{request.userNick}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.pending_actions}>
                                            <button
                                                className={styles.cancel_btn}
                                                onClick={() => handleAcceptRequest(request)}
                                            >
                                                수락
                                            </button>
                                            <button
                                                className={styles.cancel_btn}
                                                onClick={() => handleCancelRequest(request)}
                                            >
                                                거절
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // 친구 목록 화면 (기본)
    return (
        <div className={styles.section_content}>
            <div className={styles.section_search_box}>
                <div className={styles.section_search_bar}>
                    <div className={styles.section_form_container}>
                        <input
                            type="text"
                            placeholder="친구 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className={styles.section_search_ic}>
                            <img src="/bundle/img/search_ic.png" alt="search_ic" />

                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.section_friend_container}>
                {friendsList.length === 0 ? (
                    <div className={styles.no_pending_message}>
                        <p>친구 목록이 비어있습니다. 친구를 추가해보세요!</p>
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <div className={styles.no_pending_message}>

                        <p>"{searchQuery}"와(과) 일치하는 친구가 없습니다.</p>
                    </div>
                ) : (
                    filteredFriends.map((friend) => (
                        <div key={friend.userNo} className={styles.friend_list_box}>
                            <div className={styles.friend_profile_area}>
                                <img src={friend.userImg || "/bundle/img/default_profile.png"} alt="profile"/>
                                <p>{friend.userNick}</p>
                            </div>
                            <div className={styles.friend_setting_area}>
                                <img
                                    src="/bundle/img/talk_ic.png"
                                    alt="talk_ic"
                                    onClick={(e) => handleStartDm(e, friend)}
                                />
                                <img
                                    src="/bundle/img/pt3_ic.png"
                                    alt="pt3_ic"
                                    onClick={(e) => handleFriendContextMenu(e, friend)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {contextMenu.visible && (
                <FriendContextMenu
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu({ visible: false, x: 0, y: 0, friend: null })}
                    onDelete={() => handleDeleteFriend(contextMenu.friend)}
                    onBlock={() => handleBlockFriend(contextMenu.friend)}
                />
            )}
        </div>
    );
};

export default SectionContent;

