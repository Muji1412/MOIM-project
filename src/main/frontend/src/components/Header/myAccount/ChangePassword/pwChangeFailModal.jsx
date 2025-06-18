import React from 'react';
import './pwChangeFailModal.css'; // 스타일 분리

const PwChangeFailModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Reset Failed</h2>
                <p>Password doesn't match</p>
                <button className="modal-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default PwChangeFailModal;