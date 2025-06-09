import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                video: resolve(__dirname, 'video.html'),
                test: resolve(__dirname, 'test.html')
            },
            output: {
                entryFileNames: `static/js/[name].js`,
                chunkFileNames: `static/js/[name].js`,
                assetFileNames: `static/assets/[name].[ext]`
            }
        }
    }
})