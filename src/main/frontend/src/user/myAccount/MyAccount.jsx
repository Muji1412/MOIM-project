import React, {useEffect, useState} from 'react';
import './MyAccount.css';

export default function MyAccount () {
    const [img, setImg] = useState('');
    const [nick, setNick] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const token = sessionStorage.getItem('accessToken');

    useEffect(() => {
        fetch("/user/myAccount", {
            method: "GET",
            headers: {
                Authorization : `Bearer ${token}`, // JWT 포함
                "Content-Type" : "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                setUsername(data.username);
                setImg(data.userImg);
                setEmail(data.userEmail);
                setNick(data.userNick);
                setPhone(data.userPhone);
            })
            .catch(err => console.error(err));
    }, []);


    const handleModify = () => {

    }

    const handleChangePw = () => {

    }

    const handleDeleteAccount = () => {

    }

    return (
        // 헤더 제외 회원정보 나오는 부분
        <div className="myAccount-background">
            {/* 맨 위 헤드라인 부분 */}
            <div className="myAccount-headline">
                <h2> My Account </h2>
                <a><img src='/img/btn_close.png'  alt="close button"/></a>
            </div>
            {/*회원정보 박스 컨테이너*/}
            <div className="myAccount-container">
                {/* 회원정보 박스 상단 프로필사진, modify 버튼*/}
                <div className="myAccount-container-head">
                    <div className="profile-image">
                        <img src={img} alt="profile-image" className="profile-image-img"/>
                    </div>
                    <div>
                        <button className="modify-btn" onClick={handleModify}>Modify</button>
                    </div>
                </div>
                {/* 회원정보 표시되는 흰 박스*/}
                <div className="myAccount-container-under">
                    {/* 닉네임 */}
                    <div className="inner-title">Nickname</div>
                    <div className="inner-content">{nick}</div>
                    {/* 아이디 */}
                    <div className="inner-title">User name</div>
                    <div className="inner-content">{username}</div>
                    {/* 이메일 */}
                    <div className="inner-title">Email</div>
                    <div className="inner-content">{email}</div>
                    {/* 전화번호 */}
                    <div className="inner-title">Phone</div>
                    <div className="inner-content">{phone}</div>
                </div>
            </div>
            {/* 비밀번호 바꾸기 */}
            <div className="inner-title">Passwords and Authentication</div>
            <button className="pw-change-btn" onClick={handleChangePw}> Change Password </button>
            {/* 회원 탈퇴 */}
            <div className="inner-title">Remove Account</div>
            <button className="account-delete-btn" onClick={handleDeleteAccount}> Delete </button>
        </div>
    )
}