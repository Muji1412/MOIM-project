import React, {useEffect, useState} from "react";
import './AddCalendarModal.css';

export default function MyModal({ group_No, onClose, slotInfo }) {
    const [isEventAdded, setIsEventAdded] = useState(false);
    const [groupNo, setGroupNo] = useState(group_No);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('할일');
    const types = ['할일', '휴가', '공지'];
    const [isTypeExpanded, setIsTypeExpanded] = useState(false);
    const [isDone, setIsDone] = useState('in_progress');

    useEffect(() => {
        const day = new Date().toISOString().slice(0,10);
        setStartDate(day);
    }, []);


    const handleSubmit = () => {
        if(title === '' || startDate === '' || endDate === '') {
            return;
        }
        fetch('/api/calendar/addEvent', {
            method: 'POST',
            headers: {
                //Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupNo: groupNo,
                calTitle: title,
                calContent: content,
                calStart: slotInfo.start,
                calEnd: endDate,
                calType: type,
                calIsDone: isDone
            })
        }).then(res => {
            if (res.status === 200) {
                setIsEventAdded(prev=>!prev);
                onClose();
            } else {
                // console.log('???');
            }
        })
    };

    const handleExpand = () => {
        setIsTypeExpanded(prev => !prev);
    };

    const typeHandler = (selectedType) => {
        setType(selectedType);
        setIsTypeExpanded(false); // 타입 선택 시 드롭다운 닫기
    };

    const handleRadio = (e) => setIsDone(e.target.value);


    return (
        <div className="modal-background">
            <div className="modal-content">
                {/* 제목 위 하트 아이콘 */}
                <p className="modal-header-heart"><img src="/img/symbol_heart.png" alt="heart"/> </p>
                <h2 className="head-title">새 일정 추가하기</h2>
                <div className="inner-box">
                        <label className="label">
                            일정 제목
                            <input className="input-text"
                                value={title} onChange={e => setTitle(e.target.value)} />
                        </label>
                        <label className="label">
                            일정 내용
                            <input className="input-text"
                                value={content} onChange={e => setContent(e.target.value)} />
                        </label>
                        <label className="label">
                            시작일
                            <input className="input-text" type="date"
                                   value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </label>
                        <label className="label">
                            종료일
                            <input className="input-text" type="date"
                                   value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </label>
                        <label className="label-dropdown">
                            일정 타입
                        </label>
                        <div style={{ position: 'relative', display: 'block' }}>
                            {/* 기본 버튼 */}
                            {!isTypeExpanded && (
                                <button className="typeBtn" type="button" onClick={handleExpand}>
                                    {type}
                                </button>
                            )}
                            {/* 드롭다운 메뉴 */}
                            {isTypeExpanded && (
                                <div className="typeBtn-drop" >
                                    {types.map((item, idx) => (
                                        <button className="typeBtn-drop-inner"
                                            type="button"
                                            key={item}
                                            onClick={() => typeHandler(item)}

                                        >
                                            {item}
                                            {/*{idx !== types.length - 1 && <hr />}*/}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className='label'>Progress<br/>
                        <label className="label-radio">
                            <input
                                type="radio"
                                name="progress"
                                value="진행 중"
                                checked={isDone === "진행 중"}
                                onChange={handleRadio}
                            /> 진행 중
                        </label>
                        <label className="label-radio">
                            <input
                                type="radio"
                                name="progress"
                                value="완료"
                                checked={isDone === "완료"}
                                onChange={handleRadio}
                            /> 완료
                        </label>
                        <label className="label-radio">
                            <input
                                type="radio"
                                name="progress"
                                value="취소"
                                checked={isDone === "취소"}
                                onChange={handleRadio}
                            /> 취소
                        </label><br/>
                        </div>
                        <button type="submit" className="modal-btn" onClick={handleSubmit}>저장</button>
                        <button type="button" className="modal-btn-close" onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    );
}
