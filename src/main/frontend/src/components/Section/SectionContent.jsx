import styles from './Section.module.css';

export default function SectionContent() {
  return (
    <div className={styles.section_content}>
      <div className={styles.section_search_box}>
        <div className={styles.section_search_bar}>
          <form className={styles.section_form_container} action="#">
            <input type="text" placeholder="Search.." />
            <div className={styles.section_search_ic}>
              <img src="/img/search_ic.png" alt="search_ic" />
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
            <img src="/img/talk_ic.png" alt="talk_ic" />
            <img src="/img/pt3_ic.png" alt="pt3_ic" />
          </div>
        </div>
      </div>
    </div>
  );
}
