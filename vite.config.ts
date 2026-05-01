// Vite 설정 파일: 개발 서버, 빌드, 경로 별칭 등을 설정
import { defineConfig } from 'vite'  // Vite 설정 함수
import react from '@vitejs/plugin-react'  // React 플러그인
import path from 'path'  // Node.js 경로 모듈

// Vite 설정 내보내기
export default defineConfig({
  plugins: [react()],  // React 플러그인 추가 (Fast Refresh, HMR 등)
  
  // 기본 URL 설정: GitHub Pages 배포 시 경로 조정
  base: process.env.GITHUB_PAGES === 'true' ? '/project2/' : '/',
  
  // 전역 변수 정의: 브라우저 환경에서 global을 globalThis로 매핑
  define: {
    global: 'globalThis',
  },
  
  // 경로 해결 설정: 모듈 경로 별칭 설정
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // @를 src 폴더로 매핑
    },
  },
  
  // 개발 서버 설정
  server: {
    port: 3000,  // 개발 서버 포트
    
    // API 프록시 설정: 개발 환경에서 CORS 문제 해결
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE ?? 'http://localhost:8080',  // API 서버 주소
        changeOrigin: true,  // Origin 헤더 변경
      },
    },
  },
})
