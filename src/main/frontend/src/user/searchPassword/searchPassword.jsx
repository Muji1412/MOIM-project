import React, { useState } from 'react';
import './searchPassword.css';
import SearchPasswordSuccessModal from "./searchPasswordSuccessModal";
import SignupSuccessModal from "../signup/signupSuccessModal";

export default function SearchPassword() {
    const [username, setUsername] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [result, setResult] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            handleSearchPassword();
        }
    }

    const handleSearchPassword = () => {
        fetch('/api/mail/searchPw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, userEmail: userEmail }),
        })
            .then(async res => {
                //console.log('아 어떻게되는거길래 ',res.status)
                // status 별 분기
                if (res.status === 200) {
                    // 성공: 입력한 이메일로 임시비밀번호 발급
                    setResult(null);
                    const data = await res.json();
                    setShowModal(true);
                } else {
                    // 실패: 에러 메시지 추출
                    const data = await res.json();
                    if (res.status === 404) {
                        setResult(data.error);
                    } else if (res.status === 400) {
                        setResult(data.error);
                    } else {
                        setResult("알 수 없는 오류가 발생했습니다");
                    }
                }
            })
            .catch(err => {
                // 실패: 에러 메시지 추출
                console.log(err);
                setResult("서버와의 연결에 문제가 있습니다");
            });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        // 여기서 로그인 페이지로 이동
        window.location.href = "login.do";
    };

    return (
        <div className="search-background">
            {/* 21. 아이디, 이메일 입력 박스 컨테이너 */}
            <div className="search-container">
                {/* 22. 상단 로고 이미지 */}
                <img src="/bundle/img/logo_login.png" alt="logo_login" className="login-logo" />
                {/* 23. 비밀번호 찾기 타이틀 */}
                <h2>	Forgot your password? <br /> You can reset it here.</h2>
                {/* 아이디 입력 */}
                <div className="search-input-group">
                    {/* 25. 라벨과 필수입력 별 */}
                    <label>
                        ID <span className="required">*</span>
                    </label>
                    {/* 27. 입력창 */}
                    <input
                        className="search-input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                {/* 이메일 입력 */}
                <div className="search-input-group">
                    <label>
                        Email <span className="required">*</span>
                    </label>
                    {/* 37. 입력창 */}
                    <input
                        className="search-input"
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        onKeyDown={handleEnter}
                    />
                </div>

                {/* 44. 비밀번호 찾기 버튼 */}
                {result && <div className="search-error">{result}</div>}
                <button className="search-btn" onClick={handleSearchPassword}>
                    Reset Password
                </button>
                {/* 로그인 창으로 되돌아가기 */}
                <div className="search-bottom">
                    <a href="login.do" className="loginBtn">Log in</a>
                </div>
                <SearchPasswordSuccessModal isOpen={showModal} onClose={handleCloseModal} />
            </div>
        </div>
    );
}