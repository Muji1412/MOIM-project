import React from 'react';
import './searchPasswordSuccessModal.css'; // 스타일 분리

const SearchPasswordSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                {/*<h2>Finding Passwords</h2>*/}
                <p>입력하신 이메일로 새로운 비밀번호가 발송되었습니다.</p>
                <button className="modal-btn" onClick={onClose}>
                    로그인
                </button>
            </div>
        </div>
    );
};

export default SearchPasswordSuccessModal;
