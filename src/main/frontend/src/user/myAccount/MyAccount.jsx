import React, {useEffect, useState} from 'react';
import './MyAccount.css';
import MyAccountModifyModal from "./MyAccountModifyModal";
import ChangePasswordModal from "./ChangePassword/ChangePasswordModal";
import AccountDeleteModal from "./AccountDelete/AccountDeleteModal";
import LogoutModal from "./Logout/LogoutModal";

export default function MyAccount ({isOpen, onClose}) {
    const [userInfo, setUserInfo] = useState({
        email: '',
        nickname: '',
        phone: '',
        img: '',
        username: '',
        message: ''
    });
    const token = sessionStorage.getItem('accessToken');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [showPwModal, setShowPwModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    const fetchUserInfo = () => {
        fetch("/user/myAccount", {
            method: "GET",
            headers: {
                Authorization : `Bearer ${token}`, // JWT 포함
                "Content-Type" : "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                setUserInfo({
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
        <div className="box">
            {/* 좌측 회색 메뉴 */}
            <div className="menu">
                <div className="menu-title"> User Settings</div>
                <div className="menu-content"> My Account </div>
                <div className="menu-logout"
                    onClick={handleLogout}>Log out
                    <img src="/bundle/img/logout_ic_1.png" alt="logout_icon"/>
                </div>
            </div>
            {/* 헤더 제외 회원정보 나오는 부분*/}
            <div className="myAccount-background">
                {/* 맨 위 헤드라인 부분 */}
                <div className="myAccount-headline">
                    <h2> My Account </h2>
                    <a><img src='/bundle/img/btn_close.png'  alt="close button" onClick={handleClose}/></a>
                </div>
                {/*회원정보 박스 컨테이너*/}
                <div className="myAccount-container">
                    {/* 회원정보 박스 상단 프로필사진, modify 버튼*/}
                    <div className="myAccount-container-head">
                        <div className="profile-image">
                            <img src={userInfo.img} alt="profile-image" className="profile-image-img"/>
                        </div>
                        <div>
                            <button className="modify-btn" onClick={handleModify}>Modify</button>
                        </div>
                    </div>
                    {/* 회원정보 표시되는 흰 박스*/}
                    <div className="myAccount-container-under">
                        {/* 닉네임 */}
                        <div className="inner-title">Nickname</div>
                        <div className="inner-content">{userInfo.nickname}</div>
                        {/* 아이디 */}
                        <div className="inner-title">User name</div>
                        <div className="inner-content">{userInfo.username}</div>
                        {/* 이메일 */}
                        <div className="inner-title">Email</div>
                        <div className="inner-content">{userInfo.email}</div>
                        {/* 전화번호 */}
                        <div className="inner-title">Phone</div>
                        <div className="inner-content">{userInfo.phone}</div>
                        {/* 상태메시지 */}
                        <div className="inner-title">Status Message</div>
                        <div className="inner-content">{userInfo.message}</div>
                    </div>
                </div>
                {/* 비밀번호 바꾸기 */}
                <div className="inner-title">Passwords and Authentication</div>
                <button className="pw-change-btn" onClick={handleChangePw}> Change Password </button>
                {/* 회원 탈퇴 */}
                <div className="inner-title">Remove Account</div>
                <button className="account-delete-btn" onClick={handleDeleteAccount}> Delete </button>

                {/*로그아웃 모달창*/}
                <LogoutModal isOpen={showLogoutModal} onClose={handleCloseLogout}/>
                {/*회원정보 수정 모달창*/}
                {userInfo && showModifyModal && (<MyAccountModifyModal isOpen={showModifyModal}
                                      userInfo={userInfo}
                                      onClose={() => {
                                          handleCloseModifyModal();
                                          fetchUserInfo();
                                      }} />)}
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
    )
}