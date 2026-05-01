// 애플리케이션 진입점: React 앱을 DOM에 마운트하고 Mock Service Worker 설정
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'              // 메인 앱 컴포넌트
import '@/styles/globals.css'        // 전역 스타일

// Mock Service Worker 활성화 함수: 개발 환경에서 API 모킹을 위해 사용
async function enableMocking() {
  // 환경 변수로 MSW 활성화 여부 확인
  if (import.meta.env.VITE_MSW_ENABLED !== 'true') return
  
  // MSW 워커를 동적으로 import하여 시작
  const { worker } = await import('@/mocks/browser')
  return worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` }, // 서비스 워커 URL 설정
    // API 요청만 경고, 내비게이션·정적 에셋은 조용히 통과
    onUnhandledRequest(req) {
      if (req.url.includes('/api/')) {
        console.warn(`[MSW] 핸들러 없는 API 요청: ${req.method} ${req.url}`)
      }
    },
  }).catch(console.warn) // 워커 시작 실패 시 경고 로그
}

// MSW 설정 후 React 앱 렌더링
enableMocking().then(() => {
  // root DOM 요소에 React 앱을 마운트
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}).catch(console.error) // 설정 실패 시 에러 로그
