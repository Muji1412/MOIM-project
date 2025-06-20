import {useEffect, useState, useRef} from "react";
//import styles from './../components/Section/Section.module.css';
import styles from './ChattingView.module.css';
import {useLocation} from "react-router-dom";

function ChattingView() {
    // 채팅 메시지 목록을 저장할 state (화면에 표시되는 메시지들)
    const [messages, setMessages] = useState([]);
    // 입력창에 입력된 값을 저장할 state
    const [inputValue, setInputValue] = useState('');
    // 파일 업로드 input을 제어할 ref
    const fileInputRef = useRef(null);

    // URL에서 서버명과 채널명 추출
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const groupName = params.get("groupName");
    const channelName = params.get("channelName");

    // 서버 URL (수정됨: 포트 8081로 변경)
    const APPLICATION_SERVER_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:8089'  // 개발 환경 (Docker 포트)
        : 'https://moim.o-r.kr';   // 배포 환경

    // 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
    function getToday() {
        return new Date().toISOString().slice(0, 10);
    }

    // 날짜 라벨 포맷 함수 예시
    function formatDateLabel(dateStr) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (dateStr === today) return "오늘";
        if (dateStr === yesterday) return "어제";
        // 원하는 형식으로 변환 (예: '6월 5일 목요일')
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("ko-KR", {month: "long", day: "numeric", weekday: "long"});
    }

    //실시간 메시지 수신 함수
    const handleNewMessage = (event) => {
        const payload = event.detail; // Header에서 발생시킨 커스텀 이벤트의 데이터

        // 현재 보고 있는 채널의 메시지만 화면에 추가
        if (payload.channel === channelName) {
            setMessages(prev => [...prev, payload]);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const groupName = params.get("groupName");
        const channelName = params.get("channelName");

        setMessages([]); // 채널 바뀔 때마다 메시지 초기화

        // 해당 채널의 기존 채팅 히스토리를 API로 로드
        fetch(`${APPLICATION_SERVER_URL}/api/chat/${groupName}/${channelName}/all`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(err => console.error("채팅 히스토리 로드 실패:", err));

        // 실시간 메시지 수신을 위한 이벤트 리스너 등록
        window.addEventListener('newChatMessage', handleNewMessage);

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('newChatMessage', handleNewMessage);
        };
    }, [location]); // URL이 변경될 때마다 실행

    // 메시지 전송 함수
    const handleSend = () => {

        // 1. 입력값 검증
        if (!inputValue.trim()) return;

        const params = new URLSearchParams(location.search);
        const groupName = params.get("groupName");
        const channelName = params.get("channelName");

        // 전송할 메시지 객체 생성
        const newMsg = {
            date: new Date().toISOString(),
            user: '박종범', // 실제로는 현재 로그인한 사용자 정보 사용
            color: 'purple',
            text: inputValue,
            channel: channelName // 어느 채널의 메시지인지 명시
        };

        // Header에서 설정한 전역 웹소켓 클라이언트를 통해 메시지 전송
        if (window.globalStompClient && window.globalStompClient.connected) {
            window.globalStompClient.publish({
                destination: `/app/chat/${groupName}`,
                body: JSON.stringify(newMsg)
            });
            setInputValue(''); // 입력창 초기화
        } else {
            console.error("웹소켓 연결이 없습니다. 서버를 먼저 선택해주세요.");
        }
    };

    // 이미지 업로드 및 전송 함수
    const handleImageUpload = async (file) => {
        // 웹소켓 연결 상태 확인
        if (!window.globalStompClient || !window.globalStompClient.connected) {
            console.error("웹소켓 연결이 없습니다.");
            return;
        }

        const params = new URLSearchParams(location.search);
        const groupName = params.get("groupName");
        const channelName = params.get("channelName");

        // 이미지 파일을 서버에 업로드
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${APPLICATION_SERVER_URL}/api/chat/image`, {
            method: 'POST',
            body: formData,
        });

        const imageUrl = await res.text(); // 업로드된 이미지의 URL 받기

        // 이미지 메시지 객체 생성
        const newMsg = {
            date: getToday(),
            user: '박종범',
            color: 'purple',
            text: '',
            imageUrl: imageUrl,
            channel: channelName
        };
        //  전역 클라이언트 사용 (stompClient.current 대신)
        // 웹소켓을 통해 이미지 메시지 전송
        window.globalStompClient.publish({
            destination: `/app/chat/${groupName}`,
            body: JSON.stringify(newMsg)
        });
    };

    // 파일 input이 변경되면 이미지 업로드 실행
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            e.target.value = ""; // 같은 파일 연속 업로드 가능하게 초기화
        }
    };

    // + 버튼 클릭 시 파일 업로드 input을 클릭
    const handlePlusClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 입력창에서 Enter 키를 누르면 메시지 전송
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    // 날짜별로 그룹핑
    const groupByDate = messages.reduce((acc, msg) => {
        // 날짜만 추출 ('2025-06-05T16:20:00' → '2025-06-05')
        const date = msg.date ? msg.date.slice(0, 10) : '';
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    return (

        <div className={styles.section_content}>
            <div className={styles.channel_chat_wrap}>
                {/* 채팅방 헤더 */}
                <div className={styles.channel_header}>
                    <div className={styles.channel_title}># Channel</div>
                    <div className={styles.channel_desc}>#Channel's start point.</div>
                </div>
                {/* 날짜별로 메시지 구분해서 렌더링 */}
                <div>
                    {Object.entries(groupByDate).map(([date, msgs]) => (
                        <div key={date}>
                            {/* 날짜 구분선/라벨 */}
                            <div className={styles.chat_date_divider}>{formatDateLabel(date)}</div>
                            {/* 해당 날짜의 메시지들 */}
                            {msgs.map((msg, idx) => (
                                <div className={styles.chat_message_row} key={idx}>
                                    {/*<div className={`chat-avatar avatar-${msg.color}`}></div>*/}
                                    <div className={`${styles.chat_avatar} ${styles['avatar_' + msg.color]}`}></div>
                                    <div className={styles.chat_message_bubble}>
                                        <div className={styles.chat_message_user}>{msg.user}</div>
                                        {/* 텍스트 메시지 */}
                                        {msg.text && <div className={styles.chat_message_text}>{msg.text}</div>}
                                        {/* 이미지 메시지 */}
                                        {msg.imageUrl && (
                                            <div className={styles.chat_message_image}>
                                                <img src={msg.imageUrl} alt="uploaded"
                                                     style={{maxWidth: '200px', maxHeight: '200px'}}/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                        </div>
                    ))}
                </div>

                {/* 입력창 + 이미지 업로드 (+ 버튼) */}
                <div className={styles.chat_input_row}>
                    <button
                        type="button"
                        className={styles.chat_plus_icon}
                        onClick={handlePlusClick}
                        tabIndex={0}
                        aria-label="이미지 업로드"
                    >
                        <span style={{fontSize: 18, color: "#6b7280"}}>＋</span>
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{display: "none"}}
                        onChange={onFileChange}
                    />
                    <input
                        className={styles.chat_input}
                        placeholder="Send Message to #Channel"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />


                </div>
            </div>
        </div>

    );
}

export default ChattingView;
