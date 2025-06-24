import React, {useEffect, useState} from "react";
import './DetailCalendarModal.css';

export default function DetailCalendarModal ({event, group_No, onClose}) {
    const [userNick, setUserNick] = useState('');
    const [groupNo, setGroupNo] = useState(group_No);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDone, setIsDone] = useState("");

    useEffect(() => {
        fetch("api/user/getInfo", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userNo: event.resource.userNo
            })
        }).then(res =>res.json())
            .then(data => {
                setUserNick(data.username);
            });
        setIsDone(event?.resource.calIsDone);
        setEndDate(formatDate(event?.end));
        setContent(event?.resource.calContent);

            }, []);

    //일정 삭제
    const handleDeleteEvent = () => {
        fetch(("/api/calendar/deleteEvent"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calNo: event.id,
                groupNo: group_No
            })
        }).then(res => {
            if (res.status === 200) {
                onClose();
            } else {
                console.log('???');
            }
        })
    }

    //일정 디테일 가져올때 날짜 포매팅
    function formatDate(dateObj) {
        // dateObj가 문자열이면 Date 객체로 변환
        const d = (dateObj instanceof Date) ? dateObj : new Date(dateObj);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // 1월이 0이므로 +1
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    //일정 진행여부 선택버튼
    const handleRadio = (e) => setIsDone(e.target.value);

    //일정 수정
    const handleModify  = () => {
        if (endDate === '') {
            return;
        }
        fetch('/api/calendar/modifyEvent', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calNo: event.id,
                groupNo: groupNo,
                calContent: content,
                calEnd: endDate,
                calIsDone: isDone
            })
        }).then(res => {
            if (res.status === 200) {
                onClose();
            } else {
                console.log('???');
            }
        })
    };

    //달력 일정 투두리스트로 가져오기
    const handleAddTodo =() => {
        fetch("api/todoList/add", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify({
                "todoTitle" : event?.title,
                "todoEnd" : endDate,
                "todoIsDone" : isDone
            })
        }).then(res => {
            if(res.status === 200) {
                console.log('가져오기 잘됨')
                onClose();
            } else {
                console.log("가져오기 실패")
            }
        })
    }

    return (
        <div className='modal-background'>
            <div className='modal-content'>
                {/*일정 삭제버튼 */}
                <button type="button" className="modal-btn-delete"
                        onClick={handleDeleteEvent}
                >Delete event</button>
                {/*일정 제목*/}
                <div className='head-title'>
                    {event?.title}
                </div>
                {/*일정 내용*/}
                <div className='head-content'>
                    <input className="input-text"
                           value={content} onChange={e => setContent(e.target.value)} />
                </div>
                {/*마감일*/}
                <label className="label">
                    End Date :
                    <input className="input-text" type="date"
                           value={endDate} onChange={e => setEndDate(e.target.value)} />
                </label>
                {/*일정 종류*/}
                <div className='label'>
                    Event Type : {event?.resource.calType}
                </div>
                {/*일정 담당자*/}
                <div className='label'>
                     Event Owner : {userNick}
                    <button className='todoAddBtn' type='button'
                            onClick={handleAddTodo}>TodoList로 가져오기</button>
                </div>
                {/*일정 완료 여부*/}
                <div className='label'>
                    Event Progress :
                    <label className="label-radio">
                        <input
                            type="radio"
                            name="progress"
                            value="in_progress"
                            checked={isDone === "in_progress"}
                            onChange={handleRadio}
                        /> In Progress
                    </label>
                    <label className="label-radio">
                        <input
                            type="radio"
                            name="progress"
                            value="Done"
                            checked={isDone === "Done"}
                            onChange={handleRadio}
                        /> Done
                    </label>
                    <label className="label-radio">
                        <input
                            type="radio"
                            name="progress"
                            value="Canceled"
                            checked={isDone === "Canceled"}
                            onChange={handleRadio}
                        /> Canceled
                    </label><br/>
                </div>
                {/*저장버튼 */}
                <button type="button" className="modal-btn-modify" onClick={handleModify}>Modify</button>
                {/*닫기버튼 */}
                <button type="button" className="modal-btn-close" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}