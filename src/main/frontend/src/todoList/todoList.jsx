import React, {useCallback, useEffect, useState} from 'react';
import './todoList.css';

export default function todoList({groupNo}) {

    const [type, setType] = useState('전체보기');
    const types = ['전체보기', '완료된 할일만 보기', '미완료된 할일만 보기'];
    const [isTypeExpanded, setIsTypeExpanded] = useState(false);
    const [userNo, setUserNo] = useState(7);
    const [todos, SetTodos] = useState([]);

    useEffect(() => {
        console.log("씨이발");
        fetch("/api/todoList", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                "Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({ userNo })
        })
            .then(res => {
                if (res.status === 401) {
                    console.log("죽고싶다 그냥");
                    //window.location.href = '/login.do';
                    return;
                    //return Promise.reject('401 Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                const todos = data.map(item => ({
                    todoTitle: item.todoTitle,
                    todoStart: new Date(item.todoStart),
                    todoEnd: new Date(item.todoEnd),
                    resource: {
                        todoContent: item.todoContent,
                        todoIsDone: item.todoIsDone,
                        userNo: item.userNo
                    }
                }));
                SetTodos(todos);
            });
    })

    const handleExpand = () => {
        setIsTypeExpanded(prev => !prev);
    };

    const typeHandler = (selectedType) => {
        setType(selectedType);
        setIsTypeExpanded(false); // 타입 선택 시 드롭다운 닫기
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        // yyyy-MM-dd 포맷
        return date.toISOString().split('T')[0];
    };

    return(
        <div className="full-background">
            <div className="todo-outer-box">
                {/*제목 및 검색버튼 들어있는 박스 */}
                <div className="todo-header-box">
                    <h2 className="todo-title">TODO LIST</h2>
                    <div className="search-dropbox" style={{ position: 'relative', display: 'block' }}>
                        {/* 검색 기본 버튼 */}
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
                                            onClick={() => typeHandler(item)}>
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/*할일 박스*/}
                <div className="todo-section">
                    {/*할일 맨위 항목들*/}
                    <div className="todo-section-title">
                        <div className="section-label-move">#</div>
                        <div className="section-label-cont">항목</div>
                        <div className="section-label-progress">완료 여부</div>
                        <div className="section-label-end-date">마감일</div>
                        <div className="section-label-modify-delete">수정 / 삭제</div>
                    </div>
                    {/* 할일들 */}
                    <div className="todo-section-things">
                        <ul>
                            {todos.map((item, idx) => (
                                <li key={idx} style={{marginBottom: '16px', border: '1px solid #eee', padding: '8px'}}>
                                    <div><b>제목:</b> {item.todoTitle}</div>
                                    <div><b>시작일:</b> {formatDate(item.todoStart)}</div>
                                    <div><b>종료일:</b> {formatDate(item.todoEnd)}</div>
                                    <div><b>내용:</b> {item.resource?.todoContent}</div>
                                    <div><b>완료여부:</b> {item.resource?.todoIsDone ? '완료' : '미완료'}</div>
                                    <div><b>유저번호:</b> {item.resource?.userNo}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* 추가 버튼 */}
                    <div className="things-add-btn">
                        <div className="add-btn"><img src="/img/add_plus_ic.png" alt="일정 추가"/></div>
                    </div>
                </div>
            </div>
        </div>
    )
}