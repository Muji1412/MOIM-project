import React from 'react';
import './SignupSuccessModal.css'; // 스타일 분리

const SignupSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>🎉 회원가입 완료</h2>
                <p>환영합니다! 지금 바로 로그인해보세요.</p>
                <button className="modal-btn" onClick={onClose}>
                    확인
                </button>
            </div>
        </div>
    );
};

export default SignupSuccessModal;
