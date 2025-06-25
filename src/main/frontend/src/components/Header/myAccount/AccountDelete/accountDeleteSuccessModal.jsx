import React from 'react';
import './accountDeleteSuccessModal.css';

const AccountDeleteSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>회원 탈퇴 완료</h2>
                <p>다음에 다시 만나요 ( ᴗ_ᴗ̩̩ )</p>
                <button className="modal-btn" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
};

export default AccountDeleteSuccessModal;