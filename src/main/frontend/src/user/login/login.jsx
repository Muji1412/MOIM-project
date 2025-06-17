import React, { useState } from 'react';
import './login.css';

export default function Login() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [result, setResult] = useState('');
  //const navigate = useNavigate();

  const handleLogin = () => {
    fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: id, password: pw }),
    })
      .then(async res => {
      // status 별 분기
      if (res.status === 200) {
        // 성공: 토큰 응답 - 토큰 저장
        const data = await res.json();
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        //window.location.href = "/main.html";
        window.location.href = "/";
      } else {
        // 실패: 에러 메시지 추출
        const data = await res.json();
        if (res.status === 401) {
          setResult("ID or Password doesn't match");
        } else if (res.status === 404) {
          setResult(data.error || "This account has been deactivated.");
        } else {
          setResult("알 수 없는 오류가 발생했습니다");
        }
      }
    })
    .catch(err => {
      setResult("서버와의 연결에 문제가 있습니다");
    });
      //.then(res => res.json())
      // .then(data => {
      //   // 14. 로그인 성공 여부에 따라 main 이동 혹은 로그인 실패 
      //   if (data.success) {
      //     window.location.href = "/main.html";
      //     setResult("");
      //   } if (data.) {

      //   }
      //     else setResult("ID or Password doesn't match");
      // });
  };

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
          />
        </div>
        {result && <div className="login-error">{result}</div>}
        {/* 비밀번호 찾기 */}
        <div className="search-password">
          <a href="searchpassword.do" className="searchPwBtn">Did you forget your password?</a>
        </div>
        {/* 44. 로그인 버튼 */}
        <button className="login-btn" onClick={handleLogin}>
          Sign in
        </button>
        {/* 47. 하단 회원가입 링크 */}
        <div className="login-bottom">
          Do you need an account? <a href="signup.do" className="signupBtn">Sign up</a>
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