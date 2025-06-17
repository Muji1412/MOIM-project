import styles from "./Section.module.css";

export default function SectionContent({ showAddFriend }) {
  if (showAddFriend) {
    // 친구 추가 화면 (예시)
    return (
        <div className={styles.section_content}>
          <div className={styles.add_friend_area}>
            <div className={styles.add_friend_container}>
              <div className={styles.add_friend_title}>
                <p className={styles.add_friend_main_title}>Add Friends</p>
                <p className={styles.add_friend_sub_title}>
                  You can send a friend request by entering the other person's ID
                </p>
              </div>
              <div className={styles.add_friend_search_box}>
                <div className={styles.add_friend_search_bar}>
                  <form action="#">
                    <input
                        className={styles.afs_bar}
                        placeholder="Search.."
                        type="text"
                    />
                    <button className={styles.afs_btn} type="submit">
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* <h2>친구 추가</h2>
        <form>
          <input type="text" placeholder="친구 이름 또는 이메일 입력" />
          <button type="submit">추가</button>
        </form> */}
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
