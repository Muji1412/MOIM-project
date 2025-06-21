import {Calendar, dateFnsLocalizer} from "react-big-calendar";
import {useCallback, useEffect, useState} from "react";
import koLocale from 'date-fns/locale/ko';
import {format,parse,startOfWeek,getDay} from "date-fns";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AddCalendarModal from './AddCalendarModal';
import './MyCalendar.css';
import DetailCalendarModal from "./DetailCalendarModal";

const locales = {'ko' : koLocale };
const localizer = dateFnsLocalizer({format, parse, startOfWeek, getDay, locales});

export default function MyCalendar() {
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [groupNo, setGroupNo] = useState(14);
    const [detailEvent, setDetailEvent] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    //db의 데이터를 json 형태로 가져와서 events 객체에 넣는다.
    //이 events 객체가 달력에 표시되는 각각의 일정이다.
    useEffect(() => {
        console.log(sessionStorage.getItem('accessToken')); // calendar.do 진입 직후 값 찍어보기!
        fetchEvents();
        if (modalOpen || detailModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // cleanup: 모달 닫힐 때 리스너 제거
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
        }, [modalOpen, detailModalOpen])

    const fetchEvents = () => {
        fetch('api/calendar', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                "Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({ groupNo })
        })
            //.then(res=>res.json())
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/login.do';
                    return;
                    //return Promise.reject('401 Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                const events = data.map(item => ({
                    id: item.calNo,
                    title: item.calTitle,
                    start: new Date(item.calStart),
                    end: new Date(item.calEnd),
                    resource: {
                        calType: item.calType,
                        calContent: item.calContent,
                        calIsDone: item.calIsDone,
                        userNo: item.userNo
                    }
                }));
                setEvents(events);
            });
    }

    // 모달창 ESC로 닫기
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            setModalOpen(false);
            setDetailModalOpen(false);
        }
    }, []);

    const handleModalClose = () => {
        setModalOpen(false);
        fetchEvents();
    }

    const handleDetailModal = () => {
        setDetailModalOpen(true);
    }

    const handleDetailModalClose = () => {
        setDetailModalOpen(false);
    }

    return (
        <div>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{height:800}}
                onSelectSlot={(slotInfo) => {
                    setSelectedSlot(slotInfo);
                    setModalOpen(true);
                }}
                onSelectEvent={(event, e) => {
                    setDetailEvent(event);
                    handleDetailModal();
                }}
                eventPropGetter={
                    (event, start, end, isSelected) => {
                        //기본타입(할일) 인 경우 라임색으로 표시
                        let newStyle = {
                            backgroundColor: "#8aa82b",
                            color: 'white',
                            borderRadius: "0px",
                            border: "none"
                        };
                        //타입이 휴가인 경우 색상 변경
                        if (event.resource.calType === '휴가'){
                            newStyle.backgroundColor = "#66aefa"
                        }
                        //타입이 공지인 경우 색상 변경
                        if (event.resource.calType === '공지'){
                            newStyle.backgroundColor = "#fda076"
                        }

                        return {
                            className: "rbc-event",
                            style: newStyle
                        };
                    }
                }
                selectable
            />
            {/* 일정 추가 모달 */}
            {modalOpen && (
                < AddCalendarModal
                    onClose={handleModalClose}
                    slotInfo={selectedSlot}
                    group_No={groupNo}
                />
            )}
            {/* 일정 클릭 시 뜨는 상세 일정 모달 */}
            {detailModalOpen && (
                < DetailCalendarModal
                    onClose={handleDetailModalClose}
                    // slotInfo={selectedSlot}
                    group_No={groupNo}
                    event={detailEvent}
                />
            )}
        </div>
    )
}

//react-big-calendar는 일정들의 배열인 events[]를 받아서 화면에 일정대로 찍어준다.
//event의 형태는 아래와 같아야 한다.
// {
//     id: 1,
//     title: "회의",
//     start: new Date("2024-07-03T14:00:00"),
//     end: new Date("2024-07-03T15:00:00"),
//     // (필요시 group, 색상 등도 추가 가능)
// }
//즉 DB에서 가져오는 데이터의 형태를 위와 같이 맞추어줘야 한다.