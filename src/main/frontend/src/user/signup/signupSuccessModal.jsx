import React from 'react';
import './signupSuccessModal.css'; // 스타일 분리

const SignupSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay-signup">
            <div className="modal-signup">
                <h2>🎉 Signing up Completed!</h2>
                <p>Welcome to MOIM</p>
                <button className="modal-btn-signup" onClick={onClose}>
                    Login
                </button>
            </div>
        </div>
    );
};

export default SignupSuccessModal;
