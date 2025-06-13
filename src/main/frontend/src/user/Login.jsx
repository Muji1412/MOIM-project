import React from "react";

// CSS를 JavaScript 객체로 변환
const styles = {
    testContainer: {
        fontFamily: 'sans-serif',
        padding: '2rem',
        border: '2px solid #28a745',
        borderRadius: '8px',
        margin: '2rem'
    },
    testTitle: {
        color: '#28a745'
    }
};

function Login() {
    return (
        <div style={styles.testContainer}>
            <h3 style={styles.testTitle}>어떻게하냐</h3>
        </div>
    )
}

export default Login;
