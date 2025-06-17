import React from 'react';
import './SearchPasswordSuccessModal.css'; // 스타일 분리

const SearchPasswordSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Finding Passwords</h2>
                <p>We've sent a password reset email to the address you provided.</p>
                <button className="modal-btn" onClick={onClose}>
                    Login
                </button>
            </div>
        </div>
    );
};

export default SearchPasswordSuccessModal;
