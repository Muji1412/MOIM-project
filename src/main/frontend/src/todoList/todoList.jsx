import React, {useCallback, useEffect, useState} from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import './todoList.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


export default function todoList({groupNo }) {

    const [type, setType] = useState('전체보기');
    const types = ['전체보기', '완료된 할일만 보기', '미완료된 할일만 보기'];
    const [isTypeExpanded, setIsTypeExpanded] = useState(false);
    const [userNo, setUserNo] = useState('');
    const [todos, setTodos] = useState([]);
    const [today, setToday] = useState('');
    const [modTitle, setModTitle] = useState('');
    const [modEnd, setModEnd] = useState('');
    const [modIsDone, setModIsDone] = useState('');
    const [modTodoNo, setModTodoNo] = useState('');
    const [checkModified, setCheckModified] = useState(false);
    const [newTodo, setNewTodo] = useState('');
    const [newTodoEnd, setNewTodoEnd] = useState('');
    const [newTodoStart, setNewTodoStart] = useState('');
    const [editTodoNo, setEditTodoNo] = useState(null);
    const [editData, setEditData] = useState({ title: '', content: '', end: '' });

    useEffect(() => {
        const day = new Date().toISOString().slice(0,10);
        setToday(day);
        setNewTodoStart(day);
        setNewTodoEnd(day);

        fetch("/api/todoList", {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"},
            // body: new URLSearchParams({ groupNo })
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
                    todoContent: item.todoContent,
                    todoIsDone: item.todoIsDone,
                    userNo: item.userNo,
                    todoNo : item.todoNo
                }));
                setTodos(todos);
                console.log(todos);
            });
    }, [checkModified, setType])

    //드롭다운 버튼
    const handleExpand = () => {
        setIsTypeExpanded(prev => !prev);
    };

    //검색버튼
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

    // 완료된 일만 보기 필터 함수
    const getFilteredTodos = () => {
        if (type === '전체보기') return todos;
        if (type === '완료된 할일만 보기') return todos.filter(todo => todo.todoIsDone === 'done');
        if (type === '미완료된 할일만 보기') return todos.filter(todo => todo.todoIsDone !== 'done');
        return todos;
    };

    //수정할 할일 선택
    const handleEditClick = (todo) => {
        setEditTodoNo(todo.todoNo);
        setEditData({
            title: todo.todoTitle,
            content: todo.todoContent,
            end: todo.todoEnd,
        });
    };

    const handleSave = () => {
        handleTodoModify(editTodoNo, editData); // 서버에 수정 반영 함수
        setEditTodoNo(null);            // 입력창 닫기
    };

    const handleCancel = () => {
        setEditTodoNo(null);
    };

    //수정할 할일 값 저장
    const handleInputChange = (e) => {
        setEditData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    //할일 수정
    const handleTodoModify = (todoNo, editData) => {
        fetch("api/todoList/modify", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                todoNo: todoNo,
                todoTitle: editData.title,
                todoEnd: editData.end
            })
        }).then(r => {
            if (r.status === 200) {
                setCheckModified(prev => !prev);
            } else {
                alert("수정에 실패하였습니다");
            }
        })
    }

    // 완료 버튼
    const handleToggleDone = async (todoNo) => {
        setTodos((prev) =>
            prev.map((item) =>
                item.todoNo === todoNo
                    ? { ...item, todoIsDone: item.todoIsDone === 'done' ? 'in_progress' : 'done' } : item
            )
        );
        // 2) 서버에도 상태 저장(예시로 PATCH 사용)
        try {
            const target = todos.find(t => t.todoNo === todoNo);
            const nextStatus = target.todoIsDone === 'done' ? 'in_progress' : 'done';
            console.log('보낼 값', { todoNo, todoIsDone: nextStatus });
            await fetch(`/api/todoList/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ todoNo, todoIsDone: nextStatus }),
            });
        } catch (e) {
            // 실패시 롤백 등 처리
            alert("서버 반영 실패!");
        }
    };

    //목록의 할일 지우기
    const handleTodoDelete = async(todoNo) => {
        fetch("/api/todoList/delete", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
        }, body: JSON.stringify({ "todoNo" : todoNo }),})
            .then(res => {
                if(res.status === 200) {
                    setCheckModified(prev => !prev);
                    console.log('잘지워짐')
                } else {
                    console.log('안지워짐')
                }
            });
    }

    //새로운 할일 입력하기
    const handleTodoAdd = () => {
            fetch("api/todoList/add", {method: 'POST',
            headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify({ "todoTitle" : newTodo,
                                        "todoEnd" : newTodoEnd,
                                        "todoStart" : newTodoStart,
                                        "todoIsDone" : "in_progress"
                }),})
                .then(res => {
                    if(res.status === 200) {
                        console.log('잘추가됨');
                        setCheckModified(prev => !prev);
                        setNewTodo('');
                    } else {
                        alert('추가 안됨');
                    }
                })
    }

    // 할일 순서 변경 핸들러
        const handleDragEnd = (result) => {
            if (!result.destination) return;
            const reordered = Array.from(todos);
            const [removed] = reordered.splice(result.source.index, 1);
            reordered.splice(result.destination.index, 0, removed);
            setTodos(reordered);
        };

    return(
        <div className='asd'>
        <div className='todo-outer'>
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
            </div>
            <table className="todo-table">
                <thead>
                <tr className='table-tr-head'>
                    <th>#</th>
                    <th>항목</th>
                    <th>완료 여부</th>
                    <th>마감일</th>
                    <th>수정 / 삭제</th>
                </tr>
                </thead>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="todoTable">
                        {(provided) => (
                            <tbody ref={provided.innerRef} {...provided.droppableProps}>
                            {getFilteredTodos().map((todo, idx) => (
                                <Draggable key={todo.todoNo} draggableId={String(todo.todoNo)} index={idx}>
                                    {(provided, snapshot) => (
                                        <>
                                            <tr
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    background: snapshot.isDragging ? "#fafad2" : undefined,
                                                    ...provided.draggableProps.style,
                                                }}
                                            >
                                                <td>
                                                    <span className="drag-icon">☰</span>
                                                </td>
                                                <td className='todo-title-for-hover'>{todo.todoTitle}</td>
                                                <td className='middle'>
                                                    <div style={{textAlign: "center"}}>
                                                        <button
                                                            onClick={() => handleToggleDone(todo.todoNo)}
                                                            style={{
                                                                width: 18, height: 18,
                                                                borderRadius: '50%',
                                                                background: '#fff',
                                                                border: '1.5px solid #222',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginLeft: '45%'
                                                            }}
                                                            aria-label="완료 체크"
                                                        >
                                                            {todo.todoIsDone === 'done' && (
                                                                <img src='/bundle/img/checked_fill.png' alt='checked'/>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>{formatDueLabel(todo.todoEnd)}</td>
                                                <td>
                                                    <button className="edit-btn" title="수정">
                                            <span role="img" aria-label="edit">
                                            <img src="/bundle/img/pen_black.png" alt="todo_modify"
                                                 onClick={() => handleEditClick(todo)}/>
                                            </span>
                                                    </button>
                                                    <button className="delete-btn" title="삭제">
                                            <span role="img" aria-label="delete">
                                                <img src="/bundle/img/delete_xo_resize.png" alt="todo_delete"
                                                     onClick={() => handleTodoDelete(todo.todoNo)}/>
                                            </span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* 수정 모드일 때 인풋 렌더 */}
                                            {editTodoNo === todo.todoNo && (
                                                <tr>
                                                    <td className='space'></td>
                                                    <td>
                                                        <input
                                                            name="title"
                                                            value={editData.title}
                                                            onChange={handleInputChange}
                                                        />
                                                    </td>
                                                    {/*<td>*/}
                                                    {/*    <input*/}
                                                    {/*        name="content"*/}
                                                    {/*        value={editData.content}*/}
                                                    {/*        onChange={handleInputChange}*/}
                                                    {/*    />*/}
                                                    {/*</td>*/}
                                                    <td>
                                                        <input
                                                            name="end"
                                                            type="date"
                                                            value={editData.end}
                                                            onChange={handleInputChange}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button onClick={handleSave}>수정</button>
                                                        <button onClick={handleCancel}>취소</button>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </Draggable>
                            ))}
                            {/* 할일 추가 행 */}
                            <tr>
                                <td>
                                    <span className="drag-icon">
                                        {/*☰*/}
                                    </span>
                                </td>
                                <td>
                                    <input className="add-input" placeholder="새 일정 추가하기" value={newTodo}
                                           onChange={(e) => setNewTodo(e.target.value)}/>
                                </td>
                                <td />
                                <td>
                                    <input className="date-input" type="date" value={newTodoEnd}
                                           onChange={(e) => setNewTodoEnd(e.target.value)}/>
                                </td>
                                <td>
                                    <button className="add-btn" title="추가"
                                            onClick={handleTodoAdd}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             fill="currentColor" className="bi bi-patch-plus" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd"
                                                  d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5"/>
                                            <path
                                                d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            {provided.placeholder}
                            </tbody>
                        )}
                    </Droppable>
                </DragDropContext>
            </table>
            <img src="/bundle/img/symbol_heart.png" alt="하트" className='heartSym'/>
        </div>
        </div>
        </div>
    )
}

{/*{getFilteredTodos().map((todo, idx) => (*/
}
{/*    <React.Fragment key={todo.todoNo}>*/
}
{/*        <tr>*/
}
{/*            <td>*/
}
{/*                <span className="drag-icon">☰</span>*/
}
{/*            </td>*/
}
{/*            <td className='todo-title-for-hover'>{todo.todoTitle}</td>*/
}
{/*            <td className='middle'>*/
}
{/*                <div style={{textAlign: "center"}}>*/
}
{/*                    <button*/
}
{/*                        onClick={() => handleToggleDone(todo.todoNo)}*/
}
{/*                        style={{*/
}
{/*                            width: 18, height: 18,*/
}
{/*                            borderRadius: '50%',*/}
{/*                            background: '#fff',*/}
{/*                            border: '1.5px solid #222',*/}
{/*                            display: 'flex',*/}
{/*                            alignItems: 'center',*/}
{/*                            justifyContent: 'center',*/}
{/*                            marginLeft: '45%'*/}
{/*                        }}*/}
{/*                        aria-label="완료 체크"*/}
{/*                    >*/}
{/*                        {todo.todoIsDone === 'done' && (*/}
{/*                            <img src='/bundle/img/checked_fill.png' alt='checked'/>*/}
{/*                        )}*/}
{/*                    </button>*/}
{/*                </div>*/}
{/*            </td>*/}
{/*            <td>{formatDueLabel(todo.todoEnd)}</td>*/}
{/*            <td>*/}
{/*                <button className="edit-btn" title="수정">*/}
{/*        <span role="img" aria-label="edit">*/}
{/*            <img src="/bundle/img/pen_black.png" alt="todo_modify"*/}
{/*                 onClick={() => handleEditClick(todo)}/>*/}
{/*        </span>*/}
{/*                </button>*/}
{/*                <button className="delete-btn" title="삭제">*/}
{/*        <span role="img" aria-label="delete">*/}
{/*            <img src="/bundle/img/delete_xo_resize.png" alt="todo_delete"*/}
{/*                 onClick={() => handleTodoDelete(todo.todoNo)}/>*/}
{/*        </span>*/}
{/*                </button>*/}
{/*            </td>*/}
{/*        </tr>*/}
{/*        /!* 수정 모드일 때 인풋 렌더 *!/*/}
{/*        {editTodoNo === todo.todoNo && (*/}
{/*            <tr>*/}
{/*                <td></td>*/}
{/*                <td>*/}
{/*                    <input*/}
{/*                        name="title"*/}
{/*                        value={editData.title}*/}
{/*                        onChange={handleInputChange}*/}
{/*                    />*/}
{/*                </td>*/}
{/*                /!*<td>*!/*/}
{/*                /!*    <input*!/*/}
{/*                /!*        name="content"*!/*/}
{/*                /!*        value={editData.content}*!/*/}
{/*                /!*        onChange={handleInputChange}*!/*/}
{/*                /!*    />*!/*/}
{/*                /!*</td>*!/*/}
{/*                <td>*/}
{/*                    <input*/}
{/*                        name="end"*/}
{/*                        type="date"*/}
{/*                        value={editData.end}*/}
{/*                        onChange={handleInputChange}*/}
{/*                    />*/}
{/*                </td>*/}
{/*                <td>*/}
{/*                    <button onClick={handleSave}>수정</button>*/}
{/*                    <button onClick={handleCancel}>취소</button>*/}
{/*                </td>*/}
{/*            </tr>*/}
{/*        )}*/}
{/*    </React.Fragment>*/}
{/*))}*/}