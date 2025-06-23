import React, {useCallback, useEffect, useState} from 'react';
import './todoList.css';

export default function todoList({groupNo}) {

    const [type, setType] = useState('전체보기');
    const types = ['전체보기', '완료된 할일만 보기', '미완료된 할일만 보기'];
    const [isTypeExpanded, setIsTypeExpanded] = useState(false);
    const [userNo, setUserNo] = useState(7);
    const [todos, SetTodos] = useState([]);
    const [today, setToday] = useState('');
    const [modTitle, setModTitle] = useState('');
    const [modEnd, setModEnd] = useState('');
    const [modContent, setModContent] = useState('');
    const [modIsDone, setModIsDone] = useState('');
    const [modTodoNo, setModTodoNo] = useState('');
    const [checkModified, setCheckModified] = useState(false);

    useEffect(() => {
        const day = new Date().toISOString().slice(0,10);
        setToday(day);

        fetch("/api/todoList", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                "Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({ userNo })
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/login.do';
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
                console.log(todos);
            });
    }, [checkModified])

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

    // today/tomorrow 텍스트용 날짜 포매팅 함수
    const formatDueLabel = (dueDate) => {
        const today = new Date();
        const date = new Date(dueDate);
        const isToday =
            today.getFullYear() === date.getFullYear() &&
            today.getMonth() === date.getMonth() &&
            today.getDate() === date.getDate();

        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const isTomorrow =
            tomorrow.getFullYear() === date.getFullYear() &&
            tomorrow.getMonth() === date.getMonth() &&
            tomorrow.getDate() === date.getDate();

        if (isToday) return <span className="badge today">Today</span>;
        if (isTomorrow) return <span className="badge tomorrow">Tomorrow</span>;
        // 예시: 13 June
        return (
            <span className="badge other">
        {date.getDate()} {date.toLocaleString('en-US', { month: 'long' })}
      </span>
        );}

    const handleTodoModify = () => {
        fetch("api/todoList/modify", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: {
                todoTitle: modTitle,
                todoEnd: modEnd,
                todoContent: modContent,
                todoIsDone: modIsDone,
                todoNo: modTodoNo
             }
        }).then(r => {
            if (r.status === 200) {
                setCheckModified(prev => !prev);
            } else {
                alert("수정에 실패하였습니다");
            }
        })
    }

    const handleTodoDelete = () => {

    }

    return(
        <div className="todo-container">
            <h1 className="todo-title">Todo List</h1>
            <div className="todo-filter">
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
                {/*<select>*/}
                {/*    <option>전체보기</option>*/}
                {/*    <option>완료된 할일만 보기</option>*/}
                {/*    <option>미완료된 할일만 보기</option>*/}
                {/*</select>*/}
            </div>
            <table className="todo-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>항목</th>
                    <th>완료 여부</th>
                    <th>마감일</th>
                    <th>수정 / 삭제</th>
                </tr>
                </thead>
                <tbody>
                {todos.map((todo, idx) => (
                    <tr key={todo.id || idx}>
                        <td>
                            <span className="drag-icon">☰</span>
                        </td>
                        <td>{todo.todoTitle}</td>
                        <td>
                <span className="checkbox">
                  {todo.todoIsDone ? <span className="checkmark">&#10003;</span> : <span className="empty"></span>}
                </span>
                        </td>
                        <td>{formatDueLabel(todo.todoEnd)}</td>
                        <td>
                            <button className="edit-btn" title="수정">
                  <span role="img" aria-label="edit">
                    <img src="/bundle/img/pen_black.png" alt="todo_modify"
                        onClick={handleTodoModify}/>
                  </span>
                            </button>
                            <button className="delete-btn" title="삭제">
                  <span role="img" aria-label="delete">
                    <img src="/bundle/img/delete_XO.png" alt="todo_delete"
                            onClick={handleTodoDelete}/>
                  </span>
                            </button>
                        </td>
                    </tr>
                ))}
                <tr>
                    <td>
                        <span className="drag-icon">☰</span>
                    </td>
                    <td>
                        <input className="add-input" placeholder="추가하기" />
                    </td>
                    <td />
                    <td>
                        <input className="date-input" type="date" value={today} />
                    </td>
                    <td>
                        <button className="add-btn" title="추가">＋</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    )
}


// <div className="full-background">
//     <div className="todo-outer-box">
//         {/*제목 및 검색버튼 들어있는 박스 */}
//         <div className="todo-header-box">
//             <h2 className="todo-title">TODO LIST</h2>
//             <div className="search-dropbox" style={{ position: 'relative', display: 'block' }}>
//                 {/* 검색 기본 버튼 */}
//                 {!isTypeExpanded && (
//                     <button className="typeBtn" type="button" onClick={handleExpand}>
//                         {type}
//                     </button>
//                 )}
//                 {/* 드롭다운 메뉴 */}
//                 {isTypeExpanded && (
//                     <div className="typeBtn-drop" >
//                         {types.map((item, idx) => (
//                             <button className="typeBtn-drop-inner"
//                                     type="button"
//                                     key={item}
//                                     onClick={() => typeHandler(item)}>
//                                 {item}
//                             </button>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//         {/*할일 박스*/}
//         <div className="todo-section">
//             {/*할일 맨위 항목들*/}
//             <div className="todo-section-title">
//                 <div className="section-label-move">#</div>
//                 <div className="section-label-cont">항목</div>
//                 <div className="section-label-progress">완료 여부</div>
//                 <div className="section-label-end-date">마감일</div>
//                 <div className="section-label-modify-delete">수정 / 삭제</div>
//             </div>
//             {/* 할일들 */}
//             <div className="todo-section-things">
//                 <ul>
//                     {todos.map((item, idx) => (
//                         <li className="tdlist" key={idx} style={{marginBottom: '16px', border: '1px solid #eee', padding: '8px'}}>
//                             <div>{item.todoTitle}</div>
//                             <div>{formatDate(item.todoEnd)}</div>
//                             <div>{item.resource?.todoContent}</div>
//                             <div>{item.resource?.todoIsDone ? '완료' : '미완료'}</div>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//             {/* 추가 버튼 */}
//             <div className="things-add-btn">
//                 <div className="add-btn"><img src="/bundle/img/add_plus_ic.png" alt="일정 추가"/></div>
//             </div>
//         </div>
//     </div>
// </div>