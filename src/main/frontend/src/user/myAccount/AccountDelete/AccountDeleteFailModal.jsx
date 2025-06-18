import React from 'react';
import './AccountDeleteFailModal.css';

const AccountDeleteFailModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Account Deletion Failed</h2>
                <p>Check your password again.</p>
                <button className="modal-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default AccountDeleteFailModal;