import React, {useCallback, useEffect, useRef, useState} from 'react';
import './changePasswordModal.css';
import PwChangeSuccessModal from "./pwChangeSuccessModal";
import PwChangeFailModal from "./pwChangeFailModal";

const changePasswordModal = ({ userInfo, isOpen, onClose }) => {

    const [id, setId] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [pwCheck, setPwCheck] = useState(null);
    const currentPwRef = useRef(null);
    const newPwRef = useRef(null);
    const newPw2Ref = useRef(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFailModal, setShowFailModal] = useState(false);


    useEffect(() => {
        setId(userInfo.username);
    }, []);

    //새 비밀번호 입력값 2개가 서로 동일한지 체크
    const handleNewPassword2Change = (e) => {
        const value = e.target.value;
        setNewPassword2(value);

        if (!newPassword || !value) {
            setPwCheck(null);
        } else if (newPassword === value) {
            setPwCheck(false);
        } else {
            setPwCheck(true);
        }
    };

    //비밀번호 변경 요청
    const handlePwChange = () => {
        if (pwCheck) {
            newPw2Ref.current.focus();
            return;
        } else if (pwCheck === null) {
            newPwRef.current.focus();
            return;
        }
        fetch("/api/user/myAccount/modifyPw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username : id, oldPw : currentPassword, newPw : newPassword})
        })
            .then(res => {
                if (res.status === 200) {
                    setShowSuccessModal(true);
                    //onClose();
                } else {
                    setShowFailModal(true);
                    //onClose();
                }
            });
    }

    //수정 성공 모달창 닫기
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        onClose();
    }

    //수정 실패 모달창 닫기
    const handleCloseFailModal = () => {
        setShowFailModal(false);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>비밀번호 변경하기</h2>
                {/*현재 비밀번호*/}
                <div className="modal-inner-label">
                    현재 비밀번호 <p className="modal-inner-star">*</p>
                </div>
                <input type="password" className="modal-inner-input"
                       ref={currentPwRef}
                        onChange={(e) => setCurrentPassword(e.target.value)}></input>
                {/*새 비밀번호*/}
                <div className="modal-inner-label">
                    새 비밀번호 <p className="modal-inner-star">*</p>
                </div>
                <input type="password" className="modal-inner-input" value={newPassword}
                       ref={newPwRef}
                       onChange={(e) => setNewPassword(e.target.value)}></input>
                {/*새 비밀번호 체크*/}
                <div className="modal-inner-label">
                    비밀번호 확인 <p className="modal-inner-star">*</p>
                    {pwCheck === true && <span style={{ color: '#ee2349' }}>Passwords don't match</span>}
                    {pwCheck === false && <span style={{ color: '#97b82d' }}>Passwords match</span>}
                </div>
                <input  type="password" className="modal-inner-input"
                        value={newPassword2}
                       ref={newPw2Ref}
                        onChange={handleNewPassword2Change}></input>
                {/*리셋 버튼*/}
                <button className="modal-btn" onClick={handlePwChange}>
                    변경
                </button>
                {/*닫기 버튼*/}
                <button className="modal-btn-close" onClick={onClose}>
                    닫기
                </button>
                {/*비밀번호 수정 성공 모달*/}
                <PwChangeSuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal}/>
                {/* 비밀번호 수정 실패 모달*/}
                <PwChangeFailModal isOpen={showFailModal} onClose={handleCloseFailModal}/>
            </div>
        </div>
    );
};

export default changePasswordModal;