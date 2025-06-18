import {Calendar, dateFnsLocalizer} from "react-big-calendar";
import {useEffect, useState} from "react";
import koLocale from 'date-fns/locale/ko';
import {format,parse,startOfWeek,getDay} from "date-fns";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AddCalendarModal from './AddCalendarModal';

const locales = {'ko' : koLocale };
const localizer = dateFnsLocalizer({format, parse, startOfWeek, getDay, locales});

export default  function MyCalendar() {
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [groupNo, setGroupNo] = useState(22);

    //db의 데이터를 json 형태로 가져와서 events 객체에 넣는다.
    //이 events 객체가 달력에 표시되는 각각의 일정이다.
    useEffect(() => {
        fetch('api/calendar', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                "Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({ groupNo })
        })
            .then(res=>res.json())
            .then(data => setEvents(data));
    }, []);

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
                selectable
            />
            {/* 모달 */}
            {modalOpen && (
                < AddCalendarModal
                    onClose={()=>setModalOpen(false)}
                    slotInfo={selectedSlot}
                    onSave={async (formData) => {
                       await fetch('api/calendar', {
                           method: 'POST',
                           headers: {'Content-Type': 'applicaion/json'},
                           body: JSON.stringify(formData)
                       });
                       setModalOpen(false);
                }}/>
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