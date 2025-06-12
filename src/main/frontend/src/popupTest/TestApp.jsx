import React from 'react';
import './TestApp.css';


// CSS를 위한 간단한 스타일 객체
const styles = {
    body: { fontFamily: 'sans-serif', padding: '2rem', border: '2px solid #28a745', borderRadius: '8px', margin: '2rem' },
    h1: { color: '#28a745' },
    hr: { border: 'none', borderTop: '1px solid #ddd' },
    ul: { listStyle: 'none', padding: 0 },
    li: { margin: '1rem 0' },
    button: {
        backgroundColor: '#007BFF',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    p: { lineHeight: '1.6' }
};

function TestApp() {
    const openPopup = (url) => {
        const popupWidth = 1024;
        const popupHeight = 768;

        const left = (window.screen.width / 2) - (popupWidth / 2);
        const top = (window.screen.height / 2) - (popupHeight / 2);

        window.open(
            url,
            'mpaPopup',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
    };

    return (
        <div style={styles.body}>
            <h1 style={styles.h1}>✅ MPA 팝업 테스트 페이지</h1>
            <p style={styles.p}>이 페이지는 <strong>test.html</strong>과 <strong>test.jsx</strong>로부터 로드되었습니다.</p>
            <hr style={styles.hr}/>
            <h3>다른 페이지로 이동하기 (팝업 창으로 열기)</h3>
            <p style={styles.p}>새로운 탭으로 열기 테스트</p>
            <ul style={styles.ul}>
                <li style={styles.li}>
                    <a href="/" target="_blank" rel="noopener noreferrer">
                        ➡️ 메인 앱 (index.html)으로 가기 (새 탭)
                    </a>
                </li>
            </ul>
            <p style={styles.p}>
                아래 버튼을 클릭하면 **지정된 크기(1024x768)의 팝업 창**이 화면 중앙에 열려야 성공입니다.
            </p>
            <ul style={styles.ul}>
                <li style={styles.li}>
                    <button style={styles.button} onClick={() => openPopup('/index.do')}>
                        ➡️ 메인 앱 (index.html)을 팝업으로 열기
                    </button>
                </li>
                <li style={styles.li}>
                    <button style={styles.button} onClick={() => openPopup('/main.do')}>
                        ➡️ 화상 채팅 (video.html)을 팝업으로 열기
                    </button>
                </li>
            </ul>
        </div>
    );
}

export default TestApp;
