import React from 'react';
import './pwChangeSuccessModal.css'; // 스타일 분리

const PwChangeSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Reset Success!</h2>
                <p>Your password has been successfully changed.</p>
                <button className="modal-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default PwChangeSuccessModal;