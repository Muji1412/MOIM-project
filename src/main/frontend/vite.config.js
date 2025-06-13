// vite.config.js (수정 완료된 최종본)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            },
            manifest: {
                name: 'MOIM 프로젝트',
                short_name: 'MOIM',
                description: 'MOIM 프로젝트 푸시 알림',
                theme_color: '#ffffff',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
        }),
    ],

    build: {
        outDir: 'src/main/resources/static/bundle',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/main/index.jsx'),
                popupTest: path.resolve(__dirname, 'src/popupTest/Main.jsx'),
                chattingView: path.resolve(__dirname, 'src/chatting/Main.jsx'),
            },
            output: {
                entryFileNames: 'js/[name].bundle.js',
                chunkFileNames: 'js/[name].chunk.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'css/[name][extname]'; // CSS 파일 경로 명시적 지정
                    }
                    return 'assets/[name][extname]';
                }
            }
        },
    },
});
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path' // path 모듈 import
//
//
// export default defineConfig({
//     plugins: [react()],
//     root: 'src/main/react',
//     build: {
//         outDir: '../resources/static/bundle',
//         emptyOutDir: true,
//         rollupOptions: {
//             input: {
//                 main: path.resolve(__dirname,'src/main/index.jsx'),
//                 //test: path.resolve(__dirname,'src/test/Test.jsx'),
//                 popupTest: path.resolve(__dirname,'src/popupTest/Main.jsx'),
//                 chattingView: path.resolve(__dirname, 'src/chatting/Main.jsx')
//
//                 // app: path.resolve(__dirname,'src/TestApp.jsx'),
//                 // videoGrid: path.resolve(__dirname,'src/VideoGrid.jsx'),
//                 // 필요한 만큼 entry 추가 가능
//             },
//             output: {
//                 entryFileNames: 'js/[name].bundle.js',
//                 assetFileNames: 'css/[name].[ext]',
//                 chunkFileNames: 'chunk/[name].chunk.js',
//             }
//         },
//     },
// })
//
//
