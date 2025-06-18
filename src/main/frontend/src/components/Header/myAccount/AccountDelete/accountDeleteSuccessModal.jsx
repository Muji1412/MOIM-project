import React from 'react';
import './accountDeleteSuccessModal.css';

const AccountDeleteSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Good Bye</h2>
                <p>We hope to meet you again</p>
                <button className="modal-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default AccountDeleteSuccessModal;