import React from 'react';
import './signupSuccessModal.css'; // 스타일 분리

const SignupSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay-signup">
            <div className="modal-signup">
                <h2 className="success-title">🎉 회원 가입 완료!</h2>
                <p className="success-title">로그인하셔서 MOIM을 이용해보세요</p>
                <button className="modal-btn-signup" onClick={onClose}>
                    로그인
                </button>
            </div>
        </div>
    );
};

export default SignupSuccessModal;
