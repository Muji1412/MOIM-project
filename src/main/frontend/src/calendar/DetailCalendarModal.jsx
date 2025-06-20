import React, {useEffect, useState} from "react";
import './DetailCalendarModal.css';

export default function DetailCalendarModal ({event, group_No, onClose}) {
    const [detail, setDetail] = useState({});
    const [userNick, setUserNick] = useState('');
    const [groupNo, setGroupNo] = useState(group_No);

    useEffect(() => {
        fetch("api/user/getInfo", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userNo: event.resource.userNo
            })
        }).then(res =>res.json())
            .then(data => {
                setUserNick(data.username);
            });
            }, []);

    const handleDeleteEvent = () => {
        fetch(("/api/calendar/deleteEvent"), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
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

    return (
        <div className='modal-background'>
            <div className='modal-content'>
                {/*일정 삭제버튼 */}
                <button type="button" className="modal-btn-delete"
                        onClick={handleDeleteEvent}
                >Delete event</button>
                {/*일정 제목*/}
                <div className='head-title'>
                    {detail[0]}
                </div>
                {/*일정 내용*/}
                <div className='label'>
                    Contents : {event?.title}
                </div>
                {/*일정 종류*/}
                <div className='label'>
                    Event Type : {event?.resource.calType}
                </div>
                {/*일정 담당자*/}
                <div className='label'>
                    Event Owner : {userNick}
                </div>
                {/*일정 완료 여부*/}
                <div className='label'>
                    Event Progress : {event?.resource.calIsDone}
                </div>
                {/*저장버튼 */}
                <button type="button" className="modal-btn-modify" >Modify</button>
                {/*닫기버튼 */}
                <button type="button" className="modal-btn-close" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}