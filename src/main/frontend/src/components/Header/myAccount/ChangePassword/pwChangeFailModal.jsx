import React from 'react';
import './pwChangeFailModal.css'; // 스타일 분리

const PwChangeFailModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>비밀번호 변경 실패</h2>
                <p>비밀번호가 일치하지 않습니다.</p>
                <button className="modal-btn" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
};

export default PwChangeFailModal;