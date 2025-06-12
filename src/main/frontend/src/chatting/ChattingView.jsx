import { useEffect, useState } from "react";
import './chattingView.css';

function ChattingView() {
    // 초기 메시지 데이터
    const [messages, setMessages] = useState([
        { date: '2025-06-04', user: 'User', color: 'purple', text: '안녕하세요!\n신입사원 안종수입니다\n잘 부탁드립니다' },
        { date: '2025-06-04', user: 'User', color: 'blue', text: '어! 그래 종수야\n열심히 해보자' },
        { date: '2025-06-04', user: 'User', color: 'green', text: '환영합니다~~\n잘부탁드려요~~' },
        { date: '2025-06-05', user: 'User', color: 'yellow', text: 'DB 쿼리 느린 거 확인했는데 인덱스 빠져 있어서 금방 수정함.\n배포는 다음 스프린트 때 묶어서 진행할게요.' },
        { date: '2025-06-05', user: 'User', color: 'green', text: '확인 완료! 로그인 관련 버그도\n오늘 안에 fix해서 QA 넘겨둘게요' },
    ]);
    // 입력창 값 state
    const [inputValue, setInputValue] = useState('');

    // 채팅 데이터 조회 함수 
   
    const fetchChats = async () => {
        try {
              // 예시: 모든 채팅 데이터를 가져오는 API
            // 백엔드에서 날짜별로 가져오거나, 전체를 가져올 수 있음
            const res = await fetch('http://localhost:8089/api/chat');
            let data = await res.json();
            // date 기준 오름차순 정렬 (오래된→최신)
            data.sort((a, b) => a.date.localeCompare(b.date));
            setMessages(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

     // 컴포넌트 마운트 시 데이터 조회
    useEffect(() => {
        fetchChats();
    }, []);

    // 날짜별로 메시지 묶기
    const groupByDate = messages.reduce((acc, cur) => {
        acc[cur.date] = acc[cur.date] ? [...acc[cur.date], cur] : [cur];
        return acc;
    }, {});

    // 메시지 전송 함수
    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        const newMsg = { date: dateStr, user: '박종범', color: 'purple', text: inputValue };
         // 백엔드 API 호출 
        try {
            await fetch('http://localhost:8089/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMsg)
            });
            setMessages([...messages, newMsg]);
            setInputValue('');
            } catch (error) {
                console.error('Error:', error);
            }
    }; 

    //이미지 전송함수 추가했음.
    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8089/api/chat/image', {
            method: 'POST',
            body: formData,
            });
            const imageUrl = await res.text();
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10);
            const newMsg = {
            date: dateStr,
            user: '박종범',
            color: 'purple',
            text: '',
            imageUrl: imageUrl,
            };
            await fetch('http://localhost:8089/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg),
            });
            setMessages([...messages, newMsg]);
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
        }
        };

   

    // 엔터키 입력 처리 
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 폼 제출 등 기본 동작 방지
            handleSend();
        }
    };

    return (
        <div className="channel-chat-wrap">
            <div className="channel-header">
                <div className="channel-title"># Channel</div>
                <div className="channel-desc">#Channel's start point.</div>
            </div>
            {/* 날짜별로 메시지 구분해서 렌더링 */}
            {Object.entries(groupByDate).map(([date, msgs]) => (
                <div key={date}>
                    <div className="chat-date-divider">{date}</div>
                    {msgs.map((msg, idx) => (
                        <div className="chat-message-row" key={idx}>
                            <div className={`chat-avatar avatar-${msg.color}`}></div>
                            <div className="chat-message-bubble">
                                <div className="chat-message-user">{msg.user}</div>
                                <div className="chat-message-text">
                                    {msg.imageUrl ? ( <img src={msg.imageUrl} alt="chat-img" style={{ maxWidth: '200px' }} />) : 
                                            (msg.text.split('\n').map((line, i) => (
                                            <span key={i}>{line}<br /></span>
                                            ))
                                        )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
            <div className="chat-input-row">
                <input
                    className="chat-input"
                    placeholder="Send Message to #Channel"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />               
                {/* 이미지파일업로드111부분분 */}
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        handleImageUpload(file);
                        e.target.value = ""; // 같은 파일 연속 업로드 가능하게 초기화
                    }}
                />
                <label htmlFor="image-upload" style={{ cursor: "pointer", marginLeft: 8 }}>
                    📷
                </label>
            </div>            

            
        </div>
    );
}

export default ChattingView;
