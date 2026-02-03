import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    server: {
      proxy: {
        '/api/tracking': {
          target: 'https://script.google.com',
          changeOrigin: true,
          rewrite: () => {
            const url = env.VITE_TRACKING_SCRIPT_URL || '';
            return url ? new URL(url).pathname : '/macros';
          },
        },
        '/api/interaction': {
          target: 'https://script.google.com',
          changeOrigin: true,
          rewrite: () => {
            const url = env.VITE_INTERACTION_LOG_URL || '';
            return url ? new URL(url).pathname : '/macros';
          },
        },
        // 로컬 개발용: Netlify Functions를 로컬 서버로 프록시
        '/.netlify/functions': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
