// src/main/frontend/src/components/Section/SectionContent.jsx

import styles from "./Section.module.css";
import { useState, useEffect } from 'react';

export default function SectionContent({ showAddFriend, onBackToList }) {
  const [friendId, setFriendId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  // 7. pending 친구 요청 리스트를 저장할 state 추가
  const [pendingRequests, setPendingRequests] = useState([]);

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

  const fetchPendingRequests = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token || !currentUser) return;

    try {
      console.log('요청 보냄 userId:', currentUser.userNo); // userNo로 변경

      const response = await fetch('/api/friendship/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.userNo // userId 대신 userNo 사용
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('받은 데이터:', data);
        setPendingRequests(data);
      } else {
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
      }
    } catch (error) {
      console.error('요청 중 오류:', error);
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
        // 9. 친구 요청 성공 후 pending 리스트 새로고침
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

  // 10. pending 요청 취소하는 함수
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
          userA: request.id.userA,
          userB: request.id.userB
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

  if (showAddFriend) {
    return (
        <div className={styles.section_content}>
          {/* 친구 추가 영역 */}
          <div className={styles.add_friend_area}>
            <div className={styles.add_friend_container}>
              {/* 이 제목 영역은 Section.jsx에서 처리하므로 삭제합니다. */}
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

          {/* 11. Pending 요청 리스트 영역 추가 */}
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
                        <div key={request.id} className={styles.pending_item}>
                          <div className={styles.pending_user_info}>
                            <div className={styles.pending_profile_area}>
                              <img
                                  src={request.receiverProfileImage || "/bundle/img/default_profile.png"}
                                  alt="profile"
                                  className={styles.pending_profile_img}
                              />
                              <div className={styles.pending_user_details}>
                                <p className={styles.pending_username}>{request.receiverUsername}</p>
                              </div>
                            </div>
                          </div>
                          <div className={styles.pending_actions}>
                            <button
                                className={styles.cancel_btn}
                                onClick={() => handleCancelRequest(request)}
                            >
                              취소
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
          <div className={styles.friend_list_box}>
            <div className={styles.friend_profile_area}>
              <img src="#" alt="#" />
              <p>User</p>
            </div>
            <div className={styles.friend_setting_area}>
              <img src="/bundle/img/talk_ic.png" alt="talk_ic" />
              <img src="/bundle/img/pt3_ic.png" alt="pt3_ic" />
            </div>
          </div>
        </div>
      </div>
  );
}