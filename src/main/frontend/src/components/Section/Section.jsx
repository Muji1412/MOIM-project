
import { useState } from 'react';
import styles from './Section.module.css';
import SectionContent from './SectionContent';

export default function Section() {
  const [showAddFriend, setShowAddFriend] = useState(false);

  // 'Add Friend' 버튼을 누르면 친구 추가 화면을 보여줌
  const handleShowAddFriend = () => {
    setShowAddFriend(true);
  };

  // '뒤로가기' 또는 '취소' 시 친구 목록을 보여줌
  const handleShowFriendList = () => {
    setShowAddFriend(false);
  };

  const [showWhiteboard, setShowWhiteboard] = useState(false);

  //header에서 화이트보드 버튼 클릭 시 호출
  const handleShowWhiteboard = () => {
    setShowWhiteboard(true);
    setShowAddFriend(false); //다른 화면 숨김
  };
  return (
      <section className={styles.section}>
        <div className={styles.section_cotainer}>
          <div className={styles.section_title}>
            <div className={styles.section_title_box}>
              <div className={styles.section_title_wrap}>
                <div className={styles.section_title_area}>
                  <img src="/bundle/img/friend_ic.png" alt="#" />
                  {/* '친구 추가' 화면일 때 'Friend' 텍스트를 누르면 뒤로 가도록 버튼으로 변경합니다. */}
                  {showAddFriend ? (
                      <button
                          onClick={handleShowFriendList}
                          className={styles.friend_title_button}
                      >
                        Friend
                      </button>
                  ) : (
                      <p>Friend</p>
                  )}
                </div>
                {/* '친구 추가' 화면이 아닐 때만 버튼이 보이도록 조건부 렌더링 */}
                {!showAddFriend && (
                    <button
                        className={styles.add_friend_btn}
                        onClick={handleShowAddFriend}
                    >
                      Add Friend
                    </button>
                )}
              </div>
            </div>
          </div>
          {/* 자식 컴포넌트에 상태(showAddFriend)와
            상태를 변경할 함수(handleShowFriendList)를 함께 전달합니다.
          */}
          {/* SectionContent에 props 전달 */}
          <SectionContent
              showAddFriend={showAddFriend}
              showWhiteboard={showWhiteboard}
              onBackToList={() => {
                setShowAddFriend(false);
                setShowWhiteboard(false);
              }}
          />
        </div>
      </section>
  );
}