// src/main/frontend/src/components/Page/FriendAddPage.jsx

import React, { useState, useEffect } from 'react';
import { useDm } from '../../context/DmContext'; // DmContext 사용
import styles from '../Section/Section.module.css';

export default function FriendAddPage() {
    const { closeAddFriend } = useDm(); // DmContext에서 함수 가져오기

    const [friendId, setFriendId] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);

    // 사용자 정보 가져오기
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

    // 대기 중인 요청 가져오기
    useEffect(() => {
        if (!currentUser) return;
        fetchPendingRequests();
    }, [currentUser]);

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

    return (
        <section className={styles.friend_add_section}>
            <div className={styles.section_title}>
                <div className={styles.section_title_box}>
                    <div className={styles.section_title_wrap}>
                        <div className={styles.section_title_area}>
                            <img src="/bundle/img/friend_ic.png" alt="#" />
                            <p>Add Friend</p>
                        </div>
                        {/* Link 대신 closeAddFriend 함수 사용 */}
                        <button onClick={closeAddFriend} className={styles.back_to_friends_btn}>
                            Back to Friends
                        </button>
                    </div>
                </div>
            </div>
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
        </section>
    );
}
