// src/main/frontend/src/components/Section/SectionContent.jsx

import styles from "./Section.module.css";
import { useState, useEffect } from 'react';

export default function SectionContent({ showAddFriend, onBackToList }) {
  const [friendId, setFriendId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  // pending 친구 요청 리스트를 저장할 state
  const [pendingRequests, setPendingRequests] = useState([]);
  // 친구 목록을 저장할 새로운 state
  const [friendsList, setFriendsList] = useState([]);

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

  // 친구 추가 화면일 때 pending 요청을 가져옵니다.
  useEffect(() => {
    if (showAddFriend && currentUser) {
      fetchPendingRequests();
    }
  }, [showAddFriend, currentUser]);

  // 친구 목록 화면일 때 친구 리스트를 가져옵니다.
  useEffect(() => {
    if (!showAddFriend && currentUser) {
      fetchFriends();
    }
  }, [showAddFriend, currentUser]); // showAddFriend 상태에 따라 친구 목록을 다시 가져오도록 설정

  /**
   * 보류 중인 친구 요청 목록을 가져옵니다.
   * 이제 이 함수는 `FriendDTO`를 반환합니다.
   */
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
        // Friendship 엔티티 대신 FriendDTO로 받았으므로, 바로 사용 가능
        setPendingRequests(data);
      } else {
        const errorText = await response.text();
        console.error('친구 요청 에러 응답:', errorText);
        setPendingRequests([]); // 오류 발생 시 목록 초기화
      }
    } catch (error) {
      console.error('친구 요청 중 오류:', error);
      setPendingRequests([]); // 오류 발생 시 목록 초기화
    }
  };

  /**
   * 현재 사용자의 친구 목록을 가져옵니다.
   */
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
        setFriendsList([]); // 오류 발생 시 목록 초기화
      }
    } catch (error) {
      console.error('친구 목록 로딩 중 오류:', error);
      setFriendsList([]); // 오류 발생 시 목록 초기화
    }
  };

  /**
   * 친구 요청 전송을 처리합니다.
   * @param {Event} event 폼 제출 이벤트
   */
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
        fetchPendingRequests(); // 친구 요청 성공 후 pending 리스트 새로고침
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

  /**
   * 보류 중인 친구 요청을 취소합니다.
   * 이제 `request`는 `FriendDTO` 형태입니다.
   * @param {object} request 취소할 친구 요청 객체 (FriendDTO 형태)
   */
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
          userA: request.friendshipUserA, // FriendDTO에 추가된 Friendship의 userA ID 사용
          userB: request.friendshipUserB  // FriendDTO에 추가된 Friendship의 userB ID 사용
        })
      });

      if (response.ok) {
        alert('친구 요청이 취소되었습니다.');
        fetchPendingRequests(); // pending 요청 리스트 새로고침
      } else {
        alert('요청 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('요청 취소 중 오류:', error);
      alert('요청 취소 중 오류가 발생했습니다.');
    }
  };

  /**
   * 친구 요청을 수락합니다.
   * 이제 `request`는 `FriendDTO` 형태입니다.
   * @param {object} request 수락할 친구 요청 객체 (FriendDTO 형태)
   */
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
          userA: request.friendshipUserA, // FriendDTO에 추가된 Friendship의 userA ID 사용
          userB: request.friendshipUserB  // FriendDTO에 추가된 Friendship의 userB ID 사용
        })
      });

      if (response.ok) {
        alert('친구 요청이 수락되었습니다.');
        fetchPendingRequests(); // pending 요청 리스트 새로고침
        fetchFriends(); // 친구 목록 리스트도 새로고침
      } else {
        alert('친구 요청 수락에 실패했습니다.');
      }
    } catch (error) {
      console.error('친구 수락 중 오류:', error);
      alert('친구 수락 중 오류가 발생했습니다.');
    }
  };

  if (showAddFriend) {
    return (
        <div className={styles.section_content}>
          {/* 친구 추가 영역 */}
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

          {/* Pending 요청 리스트 영역 */}
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
                    // 이제 request는 FriendDTO 형태입니다.
                    pendingRequests.map((request) => (
                        // FriendDTO의 userNo를 key로 사용
                        <div key={request.userNo} className={styles.pending_item}>
                          <div className={styles.pending_user_info}>
                            <div className={styles.pending_profile_area}>
                              <img
                                  // FriendDTO의 userImg 사용
                                  src={request.userImg || "/bundle/img/default_profile.png"}
                                  alt="profile"
                                  className={styles.pending_profile_img}
                              />
                              <div className={styles.pending_user_details}>
                                {/* FriendDTO의 userNick 사용 */}
                                <p className={styles.pending_username}>{request.userNick}</p>
                                {/* FriendDTO에 요청 날짜 필드가 있다면 사용 */}
                                {/* <p className={styles.pending_date}>
                                  {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '날짜 없음'}
                                </p> */}
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

  // 기존 친구 리스트 화면
  return (
      <div className={styles.section_content}>
        <div className={styles.section_search_box}>
          <div className={styles.section_search_bar}>
            <form className={styles.section_form_container} action="#">
              <input type="text" placeholder="Search.." />
              <div className={styles.section_search_ic}>
                <img src="/bundle/img/search_ic.png" alt="search_ic" />
              </div>
            </form>
          </div>
        </div>
        <div className={styles.section_friend_container}>
          {friendsList.length === 0 ? (
              <div className={styles.no_pending_message}>
                <p>친구 목록이 비어있습니다. 친구를 추가해보세요!</p>
              </div>
          ) : (
              friendsList.map((friend) => (
                  // FriendDTO를 사용하므로 friend.userNo를 key로 사용
                  <div key={friend.userNo} className={styles.friend_list_box}>
                    <div className={styles.friend_profile_area}>
                      {/* FriendDTO에서 직접 친구의 프로필 이미지와 닉네임 사용 */}
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
