import React, {useCallback, useEffect, useState} from 'react';
import './myAccount.css';
import MyAccountModifyModal from "./myAccountModifyModal";
import ChangePasswordModal from "./ChangePassword/changePasswordModal";
import AccountDeleteModal from "./AccountDelete/accountDeleteModal";
import LogoutModal from "./Logout/logoutModal";

export default function MyAccount({isOpen, onClose}) {
    const [userInfo, setUserInfo] = useState({
        email: '',
        nickname: '',
        phone: '',
        img: '',
        username: '',
        message: ''
    });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [showPwModal, setShowPwModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    const fetchUserInfo = () => {
        fetch("/user/myAccount", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"

            }
        })
            .then(res => res.json())
            .then(data => {
                setUserInfo({
                    userNo: data.userNo,
                    email: data.userEmail,
                    nickname: data.userNick,
                    phone: data.userPhone,
                    img: data.userImg,
                    username: data.username,
                    message: data.userMsg
                });
            })
            .catch(err => console.error(err));
    }

    useEffect(() => {
        fetchUserInfo();
        if (showLogoutModal || showModifyModal || showPwModal || showDeleteModal) {
            window.addEventListener('keydown', handleKeyDown);
            // cleanup: 모달 닫힐 때 리스너 제거
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [showLogoutModal, showModifyModal, showPwModal, showDeleteModal]);

    // 모달창 ESC로 닫기
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            setShowLogoutModal(false);
            setShowModifyModal(false);
            setShowPwModal(false);
            setShowDeleteModal(false);
        }
    }, []);

    //로그아웃 모달창 켜기
    const handleLogout = () => {
        setShowLogoutModal(true);
    }

    //로그아웃 모달창 끄기
    const handleCloseLogout = () => {
        setShowLogoutModal(false);
    }

    // 회원정보 수정 모달창 켜기
    const handleModify = () => {
        setShowModifyModal(true);
    }

    // 회원정보 수정 모달창 끄기
    const handleCloseModifyModal = () => {
        setShowModifyModal(false);
    };

    // 비밀번호 수정 모달창 켜기
    const handleChangePw = () => {
        setShowPwModal(true);
    }

    // 비밀번호 수정 모달창 끄기
    const handleChangePwCloseModal = () => {
        setShowPwModal(false);
    };

    //회원탈퇴 모달창 켜기
    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    }

    //회원탈퇴 모달창 끄기
    const handleDeleteCloseAccount = () => {
        setShowDeleteModal(false);
    }

    //창닫기
    const handleClose = () => {
        onClose();
    }

    return (
        <div className="modal-overlay">
            <div className="box">
                {/* 좌측 회색 메뉴 */}
                <div className="menu">
                    <div className="menu-title">사용자 설정</div>
                    <div className="menu-content">
                        <span>내 계정</span>
                    </div>
                    <div className="menu-logout"
                         onClick={handleLogout}>
                        <span>로그아웃</span>
                        <img src="/bundle/img/logout_ic_1.png" alt="logout_icon"/>
                    </div>
                </div>
                {/* 헤더 제외 회원정보 나오는 부분*/}
                <div className="myAccount-background">
                    {/* 맨 위 헤드라인 부분 */}
                    <div className="myAccount-headline">
                        <div className="headline_left">
                            <h2>내 계정</h2>
                        </div>
                        <div className="headline_close_btn">
                            <a><img src='/bundle/img/btn_close.png' alt="close button" onClick={handleClose}/></a>
                        </div>
                    </div>
                    {/*회원정보 박스 컨테이너*/}
                    <div className="myAccount-container">
                        {/* 회원정보 박스 상단 프로필사진, modify 버튼*/}
                        <div className="myAccount-container-head">
                            <div className="setting_card_header"></div>
                            <div className="myAccount-container-head-wrap">
                                <div className="profile-image">
                                    <img src={userInfo.img || "/bundle/img/default_profile.png"} alt="user_img"
                                         className="profile-image-img"/>
                                </div>
                                <button className="modify-btn" onClick={handleModify}>프로필 편집</button>
                            </div>
                        </div>
                        {/* 회원정보 표시되는 흰 박스*/}
                        <div className="myAccount-container-under">
                            {/* 닉네임 */}
                            <div className="inner-title">닉네임</div>
                            <div className="inner-content">{userInfo.nickname}</div>
                            {/* 아이디 */}
                            <div className="inner-title">사용자명</div>
                            <div className="inner-content">{userInfo.username}</div>
                            {/* 이메일 */}
                            <div className="inner-title">이메일</div>
                            <div className="inner-content">{userInfo.email}</div>
                            {/* 전화번호 */}
                            <div className="inner-title">연락처</div>
                            <div className="inner-content">{userInfo.phone}</div>
                            {/* 상태메시지 */}
                            <div className="inner-title">상태 메시지</div>
                            <div className="inner-content">{userInfo.message}</div>
                        </div>
                    </div>
                    <div className="footer_box_area">
                        {/* 비밀번호 바꾸기 */}
                        <div className="footer_title">
                            <span>비밀번호와 인증</span>
                            <button className="pw-change-btn" onClick={handleChangePw}>비밀번호 변경하기</button>
                        </div>
                        {/* 회원 탈퇴 */}
                        <div className="footer_title">
                            <span>계정 삭제하기</span>
                            <button className="account-delete-btn" onClick={handleDeleteAccount}>삭제하기</button>
                        </div>
                    </div>

                    {/*로그아웃 모달창*/}
                    <LogoutModal isOpen={showLogoutModal} onClose={handleCloseLogout}/>
                    {/*회원정보 수정 모달창*/}
                    {userInfo && showModifyModal && (<MyAccountModifyModal isOpen={showModifyModal}
                                                                           userInfo={userInfo}
                                                                           onClose={() => {
                                                                               handleCloseModifyModal();
                                                                               fetchUserInfo();
                                                                           }}/>)}
                    {/* 비밀번호 수정 모달창 */}
                    {userInfo && showPwModal && (< ChangePasswordModal isOpen={showPwModal}
                                                                       userInfo={userInfo}
                                                                       onClose={handleChangePwCloseModal}/>)}
                    {/* 회원 탈퇴 모달창 */}
                    {userInfo && showDeleteModal && (< AccountDeleteModal isOpen={showDeleteModal}
                                                                          userInfo={userInfo}
                                                                          onClose={handleDeleteCloseAccount}/>)}
                </div>
            </div>
        </div>
    )
}