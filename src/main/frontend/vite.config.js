// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        react()
    ],

    build: {
        outDir: '../resources/static/bundle',
        emptyOutDir: true,
        rollupOptions: {
            input: {

                main: path.resolve(__dirname,'src/main/index.jsx'),
                //test: path.resolve(__dirname,'src/test/Test.jsx'),
                popupTest: path.resolve(__dirname,'src/popupTest/Main.jsx'),
                chattingView: path.resolve(__dirname, 'src/chatting/Main.jsx'),
                login: path.resolve(__dirname, 'src/user/login.jsx')

                // app: path.resolve(__dirname,'src/TestApp.jsx'),
                // videoGrid: path.resolve(__dirname,'src/VideoGrid.jsx'),
                // 필요한 만큼 entry 추가 가능

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
