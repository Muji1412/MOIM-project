import React from 'react';
import './pwChangeSuccessModal.css'; // 스타일 분리

const PwChangeSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>비밀번호 변경 성공</h2>
                <p>비밀번호가 성공적으로 변경되었습니다.</p>
                <button className="modal-btn" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
};

export default PwChangeSuccessModal;