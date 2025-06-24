// src/main/frontend/src/components/Page/FriendsAside.jsx (신규 생성)

import React, {useState} from 'react';
import {useDm} from '../../context/DmContext';
import {useAuth} from '../../context/AuthContext';
import styles from './PageLayout.module.css';
import MyAccount from "../Header/myAccount/myAccount"; // 4단계에서 만들 CSS

export default function FriendsAside() {
    const {dmRooms, selectDmRoom, activeDmRoom, returnToFriendsList} = useDm();
    const {currentUser} = useAuth();
    const [isAccountModifyModalOpen, setIsAccountModifyModalOpen] = useState(false);

    //myAccount 모달창 켜기
    const openAccountModifyModal = () => {
        setIsAccountModifyModalOpen(true);
    }

    //myAccount 모달창 끄기
    const closeAccountModifyModal = () => {
        setIsAccountModifyModalOpen(false);
    }

    return (
        <aside className={styles.aside_menu}>
            <div className={styles.menu_top}>
                <button className={styles.search_button}>Search or Start Talk</button>
            </div>

            <div className={styles.menu_list}>
                <div
                    className={`${styles.menu_item} ${!activeDmRoom ? styles.active : ''}`}
                    onClick={returnToFriendsList} // ✅ 함수를 직접 연결합니다.
                >
                    <img src="/bundle/img/friend_ic.png" alt="friend_icon"/>
                    <p>Friend</p>
                </div>
            </div>

            <div className={styles.dm_list}>
                <div className={styles.dm_list_title}>
                    <p>Direct Message</p>
                    <img src="/bundle/img/add_plus_ic.png" alt="add_dm"/>
                </div>
                <div className={styles.dm_user_area}>
                    {currentUser && dmRooms && dmRooms.map((room) => {
                        const opponent = room.user1Nick === currentUser.userNick
                            ? {
                                userNick: room.user2Nick,
                                userImg: room.user2Img || "/bundle/img/default_profile.png",
                                userNo: room.user2No
                            }
                            : {
                                userNick: room.user1Nick,
                                userImg: room.user1Img || "/bundle/img/default_profile.png",
                                userNo: room.user1No
                            };

                        return (
                            <div
                                key={room.id}
                                className={`${styles.dm_user_box} ${activeDmRoom?.id === room.id ? styles.active : ''}`}
                                onClick={() => selectDmRoom(opponent)}
                            >
                                <div className={styles.dm_user_item}>
                                    <img src={opponent.userImg} alt="profile"/>
                                    <p>{opponent.userNick}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* user_profile_card_area */}
            <div className={styles.server_menu_user_profile}>
                <div className={styles.user_box_area}>
                    <div className={styles.user_lbox}>
                        <img
                            src={currentUser?.userImg || "/bundle/img/default_profile.png"}
                            alt="user_profile"
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover"
                            }}
                        />
                        <div className={styles.mini_l_box}>
                            <strong>{currentUser?.userNick || "User"}</strong>
                            <span>{currentUser?.username || "UserId"}</span>
                        </div>
                    </div>
                    <div className={styles.user_rbox}>
                        <img src="/bundle/img/setting_ic.png" alt="set" onClick={openAccountModifyModal}/>
                    </div>
                </div>
            </div>
            {/*회원정보 모달*/}
            {isAccountModifyModalOpen && (<MyAccount isOpen={isAccountModifyModalOpen}
                                                     onClose={() => {
                                                         closeAccountModifyModal();
                                                     }}/>)}
        </aside>
    );
}