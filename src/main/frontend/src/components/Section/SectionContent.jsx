// src/main/frontend/src/components/Section/SectionContent.jsx

import styles from "./Section.module.css";
import { useState, useEffect } from 'react';

export default function SectionContent({ showAddFriend, onBackToList }) {
  const [friendId, setFriendId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);

  // 1. 친구 검색어 상태 추가
  const [searchQuery, setSearchQuery] = useState('');

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
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
          console.log('로그인한 사용자 정보:', data);
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
    if (showAddFriend && currentUser) {
      fetchPendingRequests();
    }
  }, [showAddFriend, currentUser]);

  useEffect(() => {
    if (!showAddFriend && currentUser) {
      fetchFriends();
    }
  }, [showAddFriend, currentUser]);

  const fetchPendingRequests = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token || !currentUser) return;

    try {
      console.log('받은 친구 요청 목록을 userId:', currentUser.userNo, '로 가져옵니다.');

      const response = await fetch('/api/friendship/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.userNo
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('받은 친구 요청 데이터:', data);
        setPendingRequests(data);
      } else {
        const errorText = await response.text();
        console.error('친구 요청 에러 응답:', errorText);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('친구 요청 중 오류:', error);
      setPendingRequests([]);
    }
  };

  const fetchFriends = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token || !currentUser) return;

    try {
      console.log('친구 목록을 userId:', currentUser.userNo, '로 가져옵니다.');

      const response = await fetch('/api/friendship/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.userNo
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('받은 친구 목록 데이터:', data);
        setFriendsList(data);
      } else {
        const errorText = await response.text();
        console.error('친구 목록 에러 응답:', errorText);
        setFriendsList([]);
      }
    } catch (error) {
      console.error('친구 목록 로딩 중 오류:', error);
      setFriendsList([]);
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      alert("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!friendId.trim()) {
      alert("친구의 ID를 입력해주세요.");
      return;
    }

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
        body: JSON.stringify({ requesterUsername, receiverUsername })
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
      alert('친구 요청 중 오류가 발생했습니다.');
    } finally {
      setFriendId('');
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
      alert('요청 취소 중 오류가 발생했습니다.');
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
      alert('친구 수락 중 오류가 발생했습니다.');
    }
  };

  // 2. 검색어에 따라 친구 목록을 필터링합니다.
  const filteredFriends = friendsList.filter(friend =>
      friend.userNick.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // 친구 목록 화면 렌더링
  return (
      <div className={styles.section_content}>
        <div className={styles.section_search_box}>
          <div className={styles.section_search_bar}>
            {/* 3. 검색 입력창에 value와 onChange 핸들러를 연결합니다. */}
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
          {/* 4. 필터링된 친구 목록을 렌더링하고, 검색 결과가 없을 때의 메시지를 추가합니다. */}
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
                      <img src={friend.userImg || "/bundle/img/default_profile.png"} alt="profile" />
                      <p>{friend.userNick}</p>
                    </div>
                    <div className={styles.friend_setting_area}>
                      <img src="/bundle/img/talk_ic.png" alt="talk_ic" />
                      <img src="/bundle/img/pt3_ic.png" alt="pt3_ic" />
                    </div>
                  </div>
              ))
          )}
        </div>
      </div>
  );
}