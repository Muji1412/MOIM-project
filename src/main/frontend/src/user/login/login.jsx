import React, {useCallback, useEffect, useState} from 'react';
import {useLocation,useNavigate} from "react-router-dom";
import './login.css';

export default function Login() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [result, setResult] = useState('');
  const form = new URLSearchParams();

  const handleLogin = () => {
    form.append("username", id);
    form.append("password", pw);
    fetch('/api/user/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: form.toString(),
    })
        .then(async res => {
          // ✅ status가 200이면 성공으로 간주하고, 토큰을 저장하는 로직을 제거합니다.
          if (res.ok) { // res.status === 200 과 동일
            window.location.href = "/"; // 메인 페이지로 리다이렉트
          } else {
            // 실패 시 에러 메시지 처리
            const data = await res.json().catch(() => ({error: "ID 혹은 비밀번호가 일치하지 않습니다"}));
            if (res.status === 401 || res.status === 404 || res.status === 400) {
              setResult(data.error || "ID 혹은 비밀번호가 일치하지 않습니다");
            } else {
              setResult("An unknown error occurred");
            }
          }
        })
        .catch(err => {
          //console.log(err);
          setResult("서버 연결에 문제가 발생했습니다.");
        });
  }


  return (
    <div className="login-background">
      {/* 21. 로그인 박스 컨테이너 */}
      <div className="login-container">
        {/* 22. 상단 로고 이미지 */}
        <img src="/bundle/img/logo_login.png" alt="logo_login" className="login-logo" />
        {/* 23. 로그인 타이틀 */}
        <h2></h2>
        {/* 24~33. 아이디 입력 */}
        <div className="login-input-group">
          {/* 25. 라벨과 필수입력 별 */}
          <label>
            ID <span className="required">*</span> 
          </label>
          {/* 27. 입력창 */}
          <input
            className="login-input"
            //placeholder="아이디"
            value={id}
            onChange={e => setId(e.target.value)}
          />
        </div>
        {/* 34~43. 비밀번호 입력 */}
        <div className="login-input-group">
          {/* 35. 라벨과 필수입력 별 */}
          <label>
            Password <span className="required">*</span>
          </label>
          {/* 37. 입력창 */}
          <input
            type="password"
            className="login-input"
            // placeholder="비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && id !== '') handleLogin();
            }}
          />
        </div>
        {result && <div className="login-error">{result}</div>}
        {/* 비밀번호 찾기 */}
        <div className="search-password">
          <a href="searchPassword.do" className="searchPwBtn">비밀번호 찾기</a>
        </div>
        {/* 44. 로그인 버튼 */}
        <button className="login-btn" onClick={handleLogin}>
          로그인
        </button>
        {/* 47. 하단 회원가입 링크 */}
        <div className="login-bottom">
          아직 회원이 아니신가요? <a href="signup.do" className="signupBtn">가입하기</a>
        </div>
      </div>
    </div>
  );
}

// // frontend/login/login.jsx
// import React, { useState } from 'react';

// export default function Login() {
//   const [id, setId] = useState('');
//   const [pw, setPw] = useState('');

//   const handleLogin = () => {
//     fetch('/api/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username: id, password: pw }),
//     })
//       .then(res => res.json())
//       .then(data => {
//         if (data.success) alert('로그인 성공!');
//         else alert('로그인 실패!');
//       });
//   };
//   return (
//     <div>
//       <input placeholder="아이디" value={id} onChange={e => setId(e.target.value)} />
//       <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} />
//       <button onClick={handleLogin}>로그인</button>
//     </div>
//   );
// }