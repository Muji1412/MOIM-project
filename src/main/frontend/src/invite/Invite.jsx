// /src/main/frontend/src/invite/Invite.jsx

import React, { useState, useEffect } from 'react';

export default function Invite() {
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const inviteCode = pathParts[pathParts.length - 1];

        const joinGroup = async () => {
            const token = sessionStorage.getItem('accessToken');

            if (!token) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login.do'; // 로그인 페이지로 리다이렉트
                return;
            }

            if (!inviteCode) {
                setStatus('error');
                setErrorMessage('유효하지 않은 초대 코드입니다.');
                return;
            }

            try {
                const response = await fetch(`/api/groupsInvite/join?inviteCode=${inviteCode}`, {
                    method: 'POST',
                    headers: {
                        // 'Authorization': `Bearer ${token}`
                    },
                });

                if (response.ok) {
                    setStatus('success');
                    alert('서버 참여에 성공했습니다! 메인 페이지로 이동합니다.');
                    window.location.href = '/home';
                } else {
                    const errorText = await response.text();
                    setErrorMessage(errorText || '서버 참여에 실패했습니다. 링크가 만료되었거나 유효하지 않습니다.');
                    setStatus('error');
                }
            } catch (error) {
                console.error('서버 참여 중 오류 발생:', error);
                setErrorMessage('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                setStatus('error');
            }
        };

        joinGroup();
    }, []); // 페이지가 처음 로드될 때 한 번만 실행

    return (
        <div className="invite-container">
            {status === 'loading' && (
                <>
                    <div className="invite-spinner"></div>
                    <h1>서버에 참여하는 중입니다...</h1>
                    <p>잠시만 기다려주세요.</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <h1>😥</h1>
                    <h1>서버 참여 실패</h1>
                    <p>{errorMessage}</p>
                    <button onClick={() => window.location.href = '/'} className="invite-button">
                        메인으로 돌아가기
                    </button>
                </>
            )}
        </div>
    );
}