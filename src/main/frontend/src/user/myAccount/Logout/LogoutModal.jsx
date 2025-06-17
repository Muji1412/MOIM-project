import React from 'react';
import './LogoutModal.css'; // 스타일 분리

const LogoutModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleLogout = () => {
        sessionStorage.removeItem("accessToken");
        window.location.href = "login.do";
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Log out</h2>
                {/*<p>Password doesn't match</p>*/}
                <button className="modal-btn" onClick={handleLogout}>
                    Log out
                </button>
                <button className="modal-btn-close" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default LogoutModal;