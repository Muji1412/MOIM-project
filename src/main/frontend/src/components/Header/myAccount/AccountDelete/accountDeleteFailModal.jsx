import React from 'react';
import './accountDeleteFailModal.css';

const AccountDeleteFailModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>탈퇴 오류</h2>
                <p>비밀번호를 다시 확인해 주세요.</p>
                <button className="modal-btn" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
};

export default AccountDeleteFailModal;