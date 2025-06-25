// src/main/frontend/src/components/Page/FriendListPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './Section.module.css';
import { useDm } from "../../context/DmContext";

export default function FriendListPage() {
    const { selectDmRoom, openAddFriend } = useDm();
    const [currentUser, setCurrentUser] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState({
        visible: false, x: 0, y: 0, friend: null,
    });

    // 사용자 정보 가져오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            // const token = sessionStorage.getItem('accessToken');
            // if (!token) {
            //     console.log('로그인이 필요합니다.');
            //     return;
            // }
            try {
                const response = await fetch('/api/user/my-info', {
                    method: 'GET',
                    // headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data);
                    console.log("유저 정보를 잘 받아오고 있음, 프렌드리스트페이지 콘솔로그", data);
                } else {
                    console.error('사용자 정보 로딩 실패');
                }
            } catch (error) {
                console.error('사용자 정보 로딩 중 오류:', error);
            }
        };

        fetchMyInfo();
    }, []);

    // 친구 목록 가져오기
    useEffect(() => {
        if (!currentUser) return;
        fetchFriends();
    }, [currentUser]);

    // 컨텍스트 메뉴 외부 클릭 처리
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, friend: null });
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [contextMenu.visible]);

    // 검색 필터링
    const filteredFriends = friendsList.filter(friend =>
        friend.userNick.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchFriends = async () => {
        // const token = sessionStorage.getItem('accessToken');
        // if (!token || !currentUser) return;

        try {
            const response = await fetch('/api/friendship/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({userId: currentUser.userNo})
            });

            if (response.ok) {
                const data = await response.json();
                setFriendsList(data);
                console.log("친구 목록 데이터:", data);
            } else {
                setFriendsList([]);
            }
        } catch (error) {
            console.error('친구 목록 로딩 중 오류:', error);
            setFriendsList([]);
        }
    };

    const handleStartDm = (e, friend) => {
        e.stopPropagation();
        console.log('=== DM 시작 클릭 ===');
        console.log('friend 데이터:', friend);
        console.log('selectDmRoom 함수:', selectDmRoom);

        const dmTarget = {
            userNick: friend.userNick,
            userNo: friend.userNo,
            userImg: friend.userImg
        };

        console.log('DM 대상:', dmTarget);
        selectDmRoom(dmTarget);
    };

    const handleFriendContextMenu = (e, friend) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, friend: friend });
    };

    const handleDeleteFriend = async (friend) => {
        if (!friend || !window.confirm(`'${friend.userNick}'님을 친구 목록에서 삭제하시겠습니까?`)) {
            return;
        }
        // const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch('/api/friendship/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userA: friend.friendshipUserA,
                    userB: friend.friendshipUserB,
                }),
            });
            if (response.ok) {
                alert('친구가 삭제되었습니다.');
                fetchFriends();
                // 컨텍스트 메뉴 닫기
                setContextMenu({ visible: false, x: 0, y: 0, friend: null });
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

        // const token = sessionStorage.getItem('accessToken');
        try {
            const response = await fetch('/api/friendship/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userA: friend.friendshipUserA,
                    userB: friend.friendshipUserB,
                }),
            });
            if (response.ok) {
                alert('친구가 차단되었습니다.');
                fetchFriends();
                // 컨텍스트 메뉴 닫기
                setContextMenu({ visible: false, x: 0, y: 0, friend: null });
            } else {
                alert('친구 차단에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 차단 중 오류:', error);
        }
    };

    return (
        <section className={styles.friend_list_section}>
            <div className={styles.section_title}>
                <div className={styles.section_title_box}>
                    <div className={styles.section_title_wrap}>
                        <div className={styles.section_title_area}>
                            <img src="/bundle/img/friend_ic.png" alt="#" />
                            <p>친구</p>
                        </div>
                        <button onClick={openAddFriend} className={styles.add_friend_btn}>
                            친구 추가
                        </button>
                    </div>
                </div>
            </div>

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

                {/* 직접 구현한 컨텍스트 메뉴 */}
                {contextMenu.visible && (
                    <div
                        className={styles.contextMenu}
                        style={{
                            position: 'fixed',
                            top: contextMenu.y,
                            left: contextMenu.x,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000
                        }}
                    >
                        <ul style={{
                            margin: 0,
                            padding: '4px 0',
                            listStyle: 'none'
                        }}>
                            <li
                                onClick={() => handleDeleteFriend(contextMenu.friend)}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                            >
                                친구 삭제
                            </li>
                            <li
                                onClick={() => handleBlockFriend(contextMenu.friend)}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                            >
                                친구 차단
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
