// 메인 앱 컴포넌트: 라우터와 전역 프로바이더를 설정하여 애플리케이션 구조를 정의
import { RouterProvider } from 'react-router-dom'  // React Router의 라우터 프로바이더
import { router } from './router'                 // 정의된 라우터 설정
import { AppProviders } from './providers'       // 전역 상태 및 테마 프로바이더
import { useMe } from '@/features/auth/hooks'   // 세션 복원: 쿠키 기반 /users/me

// 새로고침/앱 mount 시 쿠키로 세션 복원 (가이드 §2.2)
function SessionRestorer() {
  useMe()
  return null
}

// 애플리케이션의 최상위 컴포넌트
export default function App() {
  return (
    <AppProviders>
      <SessionRestorer />
      <RouterProvider router={router} />
    </AppProviders>
  )
}
