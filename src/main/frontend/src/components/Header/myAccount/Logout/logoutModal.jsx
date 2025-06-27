import React from 'react';
import './logoutModal.css'; // 스타일 분리

const LogoutModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleLogout = () => {
        fetch("/api/user/logout", {
            method: "POST",
            credentials: "include",
        }).then(res => {
            if (res.status === 200) {
                window.location.href = "/login.do";
            } else {
                alert("로그아웃 실패");
            }
        });
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>로그아웃하기</h2>
                {/*<p>Password doesn't match</p>*/}
                <div className="logout_area">
                    <button className="modal-btn" onClick={handleLogout}>
                        로그아웃
                    </button>
                    <button className="modal-btn-close" onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;