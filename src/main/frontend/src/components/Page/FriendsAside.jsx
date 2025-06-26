// src/main/frontend/src/components/Page/FriendsAside.jsx (신규 생성)

import React, {useState} from 'react';
import {useDm} from '../../context/DmContext';
import {useAuth} from '../../context/AuthContext';
import styles from './PageLayout.module.css';
import MyAccount from "../Header/myAccount/myAccount";
import AccountDeleteModal from "../Header/myAccount/AccountDelete/accountDeleteModal";
import AccountDeleteSuccessModal from "../Header/myAccount/AccountDelete/accountDeleteSuccessModal"; // 4단계에서 만들 CSS
import {useNavigate, useParams} from "react-router-dom";
import ChangePasswordModal from "../Header/myAccount/ChangePassword/changePasswordModal";
import PwChangeSuccessModal from "../Header/myAccount/ChangePassword/pwChangeSuccessModal"

export default function FriendsAside() {
    const {dmRooms, selectDmRoom, activeDmRoom, returnToFriendsList} = useDm();
    const {currentUser} = useAuth();
    const [isAccountModifyModalOpen, setIsAccountModifyModalOpen] = useState(false);
    const [whichModal, setWhichModal] = useState(null);
    const navigate = useNavigate();

    //myAccount 모달창 켜기
    const openAccountModifyModal = () => {
        // setIsAccountModifyModalOpen(true);
        setWhichModal('edit');
    }

    //myAccount 모달창 끄기
    const closeAccountModifyModal = () => {
        setIsAccountModifyModalOpen(false);
    }

    // accountDelete 모달 오픈시
    const openDeleteModal = () => {
        console.log('openDeleteModal 호출됨');
        setWhichModal('delete');
    };
    // 3단계: delete 성공 모달 오픈 (delete에서 호출)
    const openDeleteSuccessModal = () => setWhichModal('deleteSuccess');
    // 4단계: delete 성공 모달 닫히면 홈에서 로그인 페이지로 이동
    const handleDeleteSuccessClose = () => {
        setWhichModal(null);         // 모달 모두 닫기
        window.location.href = "/login.do";         // 로그인 페이지로 이동
    };

    //비밀번호 변경 성공 모달 오픈
    const openChangeModal = () => {
        setWhichModal('change');
    }
    //3단계: 비번 변경 성공 모달 오픈
    const openChangeSuccessModal = () => setWhichModal('changeSuccess');
    // 4단계: 비번 변경 성공 모달 닫히면 홈에서 로그인 페이지로 이동
    const handleChangeSuccessClose = () => {
        setWhichModal(null);
        window.location.href = "login.do";          // 로그인 페이지로 이동
    };

    return (
        <aside className={styles.aside_menu}>
            <div className={styles.menu_top}>
                <button className={styles.search_button}>대화 찾기 또는 시작하기</button>
            </div>

            <div className={styles.menu_list}>
                <div
                    className={`${styles.menu_item} ${!activeDmRoom ? styles.active : ''}`}
                    onClick={returnToFriendsList} // ✅ 함수를 직접 연결합니다.
                >
                    <img src="/bundle/img/friend_ic.png" alt="friend_icon"/>
                    <p>친구</p>
                </div>
            </div>

            <div className={styles.dm_list}>
                <div className={styles.dm_list_title}>
                    <p>다이렉트 메시지</p>
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
            {/*{isAccountModifyModalOpen && (<MyAccount isOpen={isAccountModifyModalOpen}*/}
            {/*                                         onClose={() => {*/}
            {/*                                             closeAccountModifyModal();*/}
            {/*                                         }}/>)}*/}
            <MyAccount
                isOpen={whichModal === 'edit'}  // or open={whichModal === 'edit'}
                onDelete={openDeleteModal}
                onPwChange={openChangeModal}
                onClose={() => setWhichModal(null)}
            />
            {/**탈퇴(삭제) 버튼 클릭 시 호출**/}
            <AccountDeleteModal
                isOpen={whichModal === 'delete'}
                onClose={() => setWhichModal(null)}
                onDeleteSuccess={openDeleteSuccessModal} // **비밀번호 확인 후 탈퇴 성공시 호출**
            />
            <AccountDeleteSuccessModal
                isOpen={whichModal === 'deleteSuccess'}
                onClose={handleDeleteSuccessClose}   // **닫기 누르면 홈에서 로그인 이동**
            />
            <ChangePasswordModal
                isOpen={whichModal === 'change'}
                onClose={() => setWhichModal(null)}
                onChangeSuccess={openChangeSuccessModal} // **비번 변경 성공시 호출**
            />
            <PwChangeSuccessModal
                isOpen={whichModal === 'changeSuccess'}
                onClose={handleChangeSuccessClose}
            />
        </aside>
    );
}