import React, { useEffect, useRef, useState} from 'react';
import './accountDeleteModal.css';
import AccountDeleteFailModal from "./accountDeleteFailModal";
import AccountDeleteSuccessModal from "./accountDeleteSuccessModal";


const AccountDeleteModal = ({ userInfo, isOpen, onClose, onDeleteSuccess  }) => {

    const [password, setPassword] = useState('');
    const currentPwRef = useRef(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFailModal, setShowFailModal] = useState(false);

    //탈퇴 요청
    const handleDeleteAccount = () => {
        if(password === null || password ==='') {
            return;
        }
        fetch("/api/user/deleteAccount", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ password })
                //JSON.stringify({password})
        })
            .then(res => {
                if (res.status === 200) {
                    // setShowSuccessModal(true);
                    onDeleteSuccess();
                } else {
                    setShowFailModal(true);
                }
            });
    }

    //탈퇴 성공 모달창 닫기
    // const handleCloseSuccessModal = () => {
    //     setShowSuccessModal(false);
    //     onClose();
    // }

    //탈퇴 실패(비밀번호 틀림) 모달창 닫기
    // const handleCloseFailModal = () => {
    //     setShowFailModal(false);
    //     onClose();
    // }

    if (!isOpen) return null;

    return (
        <div className="del_modal-overlay">
            <div className="del_modal">
                <h2>회원 탈퇴하기</h2>
                <div>비밀번호를 입력해 주세요</div>
                {/*비밀번호*/}
                <div className="modal-inner-label">
                    현재 비밀번호 <p className="modal-inner-star">*</p>
                </div>
                <input type="password" className="modal-inner-input"
                       ref={currentPwRef}
                       onChange={(e) => setPassword(e.target.value)}></input>

                <div className="btn_area">
                    {/*탈퇴 버튼*/}
                    <button className="modal-btn" onClick={handleDeleteAccount}>
                        탈퇴하기
                    </button>
                    {/*닫기 버튼*/}
                    <button className="modal-btn-close" onClick={onClose}>
                        닫기
                    </button>
                </div>
                {/*탈퇴 성공 모달*/}
                {/*<AccountDeleteSuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal}/>*/}
                {/* 탈퇴 실패 모달*/}
                {/*<AccountDeleteFailModal isOpen={showFailModal} onClose={handleCloseFailModal}/>*/}
            </div>
        </div>
    );
};

export default AccountDeleteModal;