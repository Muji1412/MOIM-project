import React, {useCallback, useEffect, useRef, useState} from 'react';
import './myAccountModifyModal.css';
import debounce from "lodash/debounce";

const MyAccountModifyModal = ({ userInfo, isOpen, onClose }) => {
    const [username, setUsername] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [userNick, setUserNick] = useState('');
    const [newNick, setNewNick] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userImg, setUserImg] = useState('');
    const [userMsg, setUserMsg] = useState('');
    const [emailCheck, setEmailCheck] = useState('');
    const [phoneCheck, setPhoneCheck] = useState('');
    const [nickCheck, setNickCheck] = useState('');
    const userEmailRef = useRef(null);
    const userNickRef = useRef(null);
    const userPhoneRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!userInfo) return;
        setUsername(userInfo.username);
        setUserEmail(userInfo.email);
        setNewEmail(userInfo.email);
        setUserNick(userInfo.nickname);
        setNewNick(userInfo.nickname);
        setUserPhone(userInfo.phone);
        setUserImg(userInfo.img);
        setUserMsg(userInfo.message);
        //console.log(userEmail, newEmail);
    }, [userInfo]);

    const handleSave = async () => {
        //이미지 클라우드 저장 및 url 반환받아 userImg에 넣기
        const imgUrl = await handleImgUpload(selectedFile); // selectedFile은 따로 저장해둔 파일 객체
        const finalImg = imgUrl || userImg; // 이미지 업로드 안 했으면 기존 값 유지
        // 저장 요청 보내기
        const res = await fetch("/api/user/myAccount/modifyInfo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username
                , userEmail : newEmail
                , userNick : newNick
                , userPhone
                , userImg : finalImg
                , userMsg})
        })
            .then(res => res.json())
            .then(() => {

                onClose();
            });
    };

    //이메일 정규식
    const emailRegEx = /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/i;

    // 이메일 중복 체크
    const checkUserEmail = useCallback(
        debounce(() => {
            //console.log("새로입력 : ", newEmail, " 기존이메일 : ",userEmail);
            if(newEmail === userEmail) {
                return;
            }
            if (!emailRegEx.test(userEmail)) {
                setEmailCheck(true);
                return;
            }
            if (!userEmail) {
                setEmailCheck(null);
                return;
            }
            fetch(`/api/user/emailCheck?userEmail=${encodeURIComponent(newEmail)}`)
                .then(res => res.text())
                .then(text => setEmailCheck(text === "true"))
                .catch(() => setEmailCheck(null));
        }, 500), [newEmail, userEmail]
    );

    //이메일 변경시 호출
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setNewEmail(value);
        checkUserEmail();
    }

    // 닉네임 중복 체크
    const checkUserNick = useCallback(
        debounce(() => {
            if(userNick === newNick) {
                return;
            }
            if (!userNick) {
                setNickCheck(null);
                return;
            }
            fetch(`/api/user/nickCheck?userNick=${encodeURIComponent(newNick)}`,
                {
                    method: 'GET',
                    })
                .then(res => res.text())
                .then(text => setNickCheck(text === "true"))
                .catch(() => setNickCheck(null));
        }, 500), [newNick, userNick]
    );

    //닉네임 변경시 동작
    const handleNickCheck = (e) => {
        const value = e.target.value;
        setNewNick(value);
        checkUserNick();
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

   const handleImgUpload = async (selectedFile) => {
        if (!selectedFile) return null;
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folderPath', userInfo.userNo.toString());

        //클라우드에 formData 이용해 파일업로드
        const uploadRes = await fetch('/api/files', {
            method: 'POST',
            body: formData,
        });
        //db에 이미지 url 저장
        const imgUrl = await uploadRes.text();
        //console.log(imgUrl);
        return imgUrl;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            setSelectedFile(file);
            reader.onload = () => {
                setPreviewUrl(reader.result);
            }
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modify_modal-overlay">
            <div className="modify_modal">
                {/* 제목 위 하트 아이콘 */}
                <p className="modal-header-heart"><img src="/img/symbol_heart.png" alt="heart"/> </p>
                {/* 창 제목 */}
                <h2 className="modal-title">사용자 정보 수정</h2>
                <div className="modal-inner-box">
                    {/*이메일*/}
                    <div className="modal-inner-label">
                        Email <p className="modal-inner-star">*</p>
                    </div>
                    <input className="modal-inner-input" value={newEmail}
                           onChange={e => setNewEmail(e.target.value)}
                           ref={userEmailRef}
                           onBlur={handleEmailChange}></input>
                    {emailCheck === true && <span style={{ color: '#ee2349' }}>Email is not available</span>}
                    {emailCheck === false && <span style={{ color: '#97b82d' }}>Available Email</span>}

                    {/*닉네임*/}
                    <div className="modal-inner-label">
                        닉네임 <p className="modal-inner-star">*</p>
                    </div>
                    <input className="modal-inner-input" value={newNick}
                           ref={userNickRef}
                           onChange={handleNickCheck}></input>
                    {nickCheck === true && <span style={{ color: '#ee2349' }}>Nickname is not available</span>}
                    {nickCheck === false && <span style={{ color: '#97b82d' }}>Available Nickname</span>}

                    {/*전화번호*/}
                    <div className="modal-inner-label">
                        전화번호 <p className="modal-inner-star">*</p>
                    </div>
                    <input className="modal-inner-input" value={userPhone}
                           ref={userPhoneRef}
                           onChange={e => setUserPhone(e.target.value)}
                           onBlur={(e) => handlePhone(e.target.value)}></input>
                    {phoneCheck === true && <span style={{ color: '#ee2349' }}>Please write in 11 digits number</span>}
                    {phoneCheck === false && <span style={{ color: '#97b82d' }}></span>}
                    {/*상태메시지*/}
                    <div className="modal-inner-label">
                        상태메시지 <p className="modal-inner-star"></p>
                    </div>
                    <input className="modal-inner-input" value={userMsg}
                           onChange={e => setUserMsg(e.target.value)}></input>
                    {/*프로필 이미지*/}
                    <div className="profile-image-box">
                        <div className="modal-inner-label">
                            프로필 이미지 <p className="modal-inner-star"></p>
                        </div>
                        <input  id="fileUpload" type="file" accept="image/*"
                                style={{display:"none"}} onChange={handleFileChange}></input>
                        <label htmlFor="fileUpload" className="custom-file-label">
                            {previewUrl !== null ? <img src={previewUrl} alt="previewImg"/>
                                : <img src={userImg} alt="addImg"/>}
                        </label>
                    </div>
                </div>
                {/*수정 버튼*/}
                <button className="modal-btn" onClick={handleSave}>
                    수정
                </button>
                {/*닫기 버튼*/}
                <button className="modal-btn-close" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
};

export default MyAccountModifyModal;