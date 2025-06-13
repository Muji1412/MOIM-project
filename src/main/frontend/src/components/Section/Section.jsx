// src/component/Section/Section.jsx
import styles from './Section.module.css';
import SectionContent from './SectionContent';

export default function Section() {
  return (
    <section className={styles.section}>
      <div className={styles.section_cotainer}>
        <div className={styles.section_title}>
          <div className={styles.section_title_box}>
            <div className={styles.section_title_wrap}>
              <div className={styles.section_title_area}>
                <img src="/img/friend_ic.png" alt="#" />
                <p>Friend</p>
              </div>
              <button className={styles.add_friend_btn}>Add Friend</button>
            </div>
          </div>
        </div>
        <SectionContent/>
      </div>
    </section>
  );
}
