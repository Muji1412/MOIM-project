// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    publicDir: path.resolve(__dirname, 'public'),
    build: {
        outDir: path.resolve(__dirname, '../../main/resources/static/bundle'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                // ✅ 메인 애플리케이션 진입점 (헤더와 컨텐츠를 모두 포함)
                main: path.resolve(__dirname, 'src/main/index.jsx'),

                // ❌ Header.jsx는 App.jsx 내부에서 import되므로 별도 진입점이 필요 없습니다.
                // header: path.resolve(__dirname, 'src/Header.jsx'),

                // ✅ 로그인/회원가입처럼 완전히 다른 페이지는 그대로 둡니다.
                login: path.resolve(__dirname, 'src/user/login/Main.jsx'),
                signup: path.resolve(__dirname, 'src/user/signup/Main.jsx'),
                searchPassword: path.resolve(__dirname, 'src/user/searchPassword/Main.jsx'),

                // 필요에 따른 기타 페이지들
                //chattingView: path.resolve(__dirname, 'src/chatting/Main.jsx'),
                popupTest: path.resolve(__dirname, 'src/popupTest/Main.jsx'),
                //myAccount: path.resolve(__dirname, 'src/user/myAccount/Main.jsx')
                calendar: path.resolve(__dirname, 'src/calendar/Main.jsx'),
                invite: path.resolve(__dirname, 'src/invite/Main.jsx'),
                videocall: path.resolve(__dirname, 'src/videocall/Main.jsx'),
                // whiteboard 사이즈때문에 매번 빌드 오래걸리니 일단 주석처리
                whiteboard: path.resolve(__dirname, 'src/whiteboard/Main.jsx'),
                // todoList: path.resolve(__dirname, 'src/todoList/Main.jsx')

            },
            output: {
                entryFileNames: 'js/[name].bundle.js',
                chunkFileNames: 'js/[name].chunk.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                            return 'css/[name][extname]';
                    }
                    return 'assets/[name][extname]';
                },
            },
        },
        watch: {
            // 파일 시스템 폴링을 사용하여 변경 사항을 감지합니다.
            usePolling: true,
        },
    },
});