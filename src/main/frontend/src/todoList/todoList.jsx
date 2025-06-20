import React, {useCallback, useEffect, useState} from 'react';
import './todoList.css';

export default function todoList() {

    const [type, setType] = useState('전체보기');
    const types = ['전체보기', '완료된 할일만 보기', '미완료된 할일만 보기'];
    const [isTypeExpanded, setIsTypeExpanded] = useState(false);

    useEffect(() => {
        fetch()
    })

    const handleExpand = () => {
        setIsTypeExpanded(prev => !prev);
    };

    const typeHandler = (selectedType) => {
        setType(selectedType);
        setIsTypeExpanded(false); // 타입 선택 시 드롭다운 닫기
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