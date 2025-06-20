// src/main/frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                console.log('로그인이 필요합니다.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/user/my-info', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data);
                } else {
                    console.error('사용자 정보 로딩 실패');
                }
            } catch (error) {
                console.error('사용자 정보 로딩 중 오류:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyInfo();
    }, []);

    const value = {
        currentUser,
        loading
    };

    // 로딩 중일 때는 아무것도 렌더링하지 않거나 로딩 스피너를 보여줄 수 있습니다.
    // 이는 currentUser가 필요한 컴포넌트들이 null 값으로 렌더링되는 것을 방지합니다.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
