import React, { useState, useCallback, useRef } from 'react';
import './signup.css';
import debounce from 'lodash/debounce';
import SignupSuccessModal from './signupSuccessModal';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [nameCheck, setNameCheck] = useState(null);
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [pwCheck, setPwCheck] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [emailCheck, setEmailCheck] = useState('');
    const [userNick, setUserNick] = useState(null);
    const [nickCheck, setNickCheck] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [phoneCheck, setPhoneCheck] = useState('');
    const usernameRef = useRef(null);
    const password2Ref = useRef(null);
    const userEmailRef = useRef(null);
    const userNickRef = useRef(null);
    const userPhoneRef = useRef(null);
    const [showModal, setShowModal] = useState(false);

    // 아이디 중복 체크
    const checkUsername = useCallback(
        debounce((username) => {
        if (!username) {
            setNameCheck(null);
            return;
        }
        fetch(`/api/user/usernameCheck?username=${encodeURIComponent(username)}`)
            .then(res => res.text())
            .then(text => setNameCheck(text === "true"))
            .catch(() => setNameCheck(null));
        }, 500), // 500ms debounce
        []
    );

    // id 변경시 호출
    const handleIdChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        checkUsername(value);
    };

    //비밀번호 동일 여부 체크
    const handlePwChange = (e) => {
        const value = e.target.value;
        setPassword2(value);
        console.log("password: ", password, " password2 : ", password2)
        if(password !== password2) {
            console.log("왜안됨")
            setPwCheck(true);
        } else {
            setPwCheck(false);
        }
    }

    //이메일 정규식
    const emailRegEx = /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/i;

    // 이메일 중복 체크
    const checkUserEmail = useCallback(
        debounce((userEmail) => {
            if (!emailRegEx.test(userEmail)) {
                setEmailCheck(true);
                return;
            }
            if (!userEmail) {
                setEmailCheck(null);
                return;
            }
            fetch(`/api/user/emailCheck?userEmail=${encodeURIComponent(userEmail)}`)
                .then(res => res.text())
                .then(text => setEmailCheck(text === "true"))
                .catch(() => setEmailCheck(null));
            }, 500), []
    );
    
    //이메일 변경시 호출
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setUserEmail(value);
        checkUserEmail(value);
    }

    // 닉네임 중복 체크
    const checkUserNick = useCallback(
        debounce((userNick) => {
        if (!userNick) {
            setNickCheck(null);
            return;
        }
        fetch(`/api/user/nickCheck?userNick=${encodeURIComponent(userNick)}`)
            .then(res => res.text())
            .then(text => setNickCheck(text === "true"))
            .catch(() => setNickCheck(null));
        }, 500), []
    );

    //닉네임 변경시 동작
    const handleNickCheck = (e) => {
        const value = e.target.value;
        setUserNick(value);
        checkUserNick(value);
    }

    //전화번호 정규식
    const checkPhonenumber =  /^01(?:0|1|[6-9])-(?:\d{3}|\d{4})-\d{4}$/

    const checkPhonenumber2 = /^01(?:0|1|[6-9])(?:\d{3}|\d{4})\d{4}$/

    //전화번호 유효성 검사
    const handlePhone = useCallback(
        debounce((userPhone) => {
            if (!userPhone) {
                setUserPhone(null);
                return;
            }
            if (!checkPhonenumber.test(userPhone) && !checkPhonenumber2.test(userPhone)) {
                //console.log('잘못 입력했을때 : ', userPhone)
                setPhoneCheck(true);
            } else {
                //console.log('전화번호 : ', userPhone)
                setPhoneCheck(false);
            }
        }, 500), []
    );



    const handleSignup = () => {
        if (nameCheck !== false) {
            setNameCheck(true);
            usernameRef.current.focus();
            return;
        } else if (pwCheck !== false) {
            password2Ref.current.focus();
            return;
        } else if (emailCheck !== false) {
            userEmailRef.current.focus();
            return;
        } else if (nickCheck !== false) {
            userEmailRef.current.focus();
            return;
        }
        fetch('/api/user/signUp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, userEmail, userNick, userPhone })
        })
        .then(res => {
            if (res.status === 200) {
                setShowModal(true);
            } else {
                alert(data.message || "오류로 인하여 가입에 실패하였습니다.");
            }
        });
    }

    const handleCloseModal = () => {
        setShowModal(false);
        // 원하면 여기서 로그인 페이지로 이동 가능
        window.location.href = "login.do";
    };

    return (
    <div className="signup-background">
      <div className="signup-container">
        <img src="/bundle/img/logo_signup.png" alt="logo_signup" className="signup-logo" />
        {/* 아이디 */}
        <div className="signup-input-group">
          <label>
            ID <span className="required">*</span> 
          </label>
          <input
            className={nameCheck === true? "input-error":"signup-input"}
            value={username}
            ref={usernameRef}
            onChange={handleIdChange}
          />
          {nameCheck === true && <span style={{ color: '#ee2349' }}>ID is not available</span>}
          {nameCheck === false && <span style={{ color: '#97b82d' }}>Available ID</span>}
        </div>
        {/* 비밀번호 */}
        <div className="signup-input-group">
          <label>
            Password <span className="required">*</span>
          </label>
          <input
            type="password"
            className="signup-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          </div>
        {/* 비밀번호 체크*/}
        <div className="signup-input-group">
          <label>
            Confirm Password <span className="required">*</span>
          </label>
          <input
            type="password"
            className={pwCheck === true? "input-error":"signup-input"}
            value={password2}
            ref={password2Ref}
            onChange={e => setPassword2(e.target.value)}
            onBlur={e => handlePwChange(e)}
          />
          {pwCheck === true && <span style={{ color: '#ee2349' }}>Passwords don't match</span>}
            {pwCheck === false && <span style={{ color: '#97b82d' }}>Passwords match</span>}
        </div>
        {/* 이메일 */}
        <div className="signup-input-group">
          <label>
            Email <span className="required">*</span>
          </label>
          <input
            className= {emailCheck === true? "input-error":"signup-input"}
            value={userEmail}
            ref={userEmailRef}
            onChange={e => setUserEmail(e.target.value)}
            onBlur={handleEmailChange}
          />
          {emailCheck === true && <span style={{ color: '#ee2349' }}>Email is not available</span>}
          {emailCheck === false && <span style={{ color: '#97b82d' }}>Available Email</span>}
        </div>
        {/* 닉네임 */}
        <div className="signup-input-group">
          <label>
            Nick <span className="required">*</span>
          </label>
          <input
            className= {nickCheck === true? "input-error":"signup-input"}
            value={userNick}
            ref={userNickRef}
            onChange={handleNickCheck}
          />
          {nickCheck === true && <span style={{ color: '#ee2349' }}>Nickname is not available</span>}
          {nickCheck === false && <span style={{ color: '#97b82d' }}>Available Nickname</span>}
        </div>
        {/* 핸드폰 */}
        <div className="signup-input-group">
          <label>
            Phone <span className="required">*</span>
          </label>
          <input
            className="signup-input"
            value={userPhone}
            ref={userPhoneRef}
            onChange={e => setUserPhone(e.target.value)}
            onBlur={(e) => handlePhone(e.target.value)}
          />
            {phoneCheck === true && <span style={{ color: '#ee2349' }}>Please write in 11 digits number</span>}
            {phoneCheck === false && <span style={{ color: '#97b82d' }}></span>}
        </div>


        {/* 회원가입 버튼 */}
        <button className="signup-btn" onClick={handleSignup}>
          Sign up
        </button>
          <SignupSuccessModal isOpen={showModal} onClose={handleCloseModal} />
        </div>
    </div>
    )
}