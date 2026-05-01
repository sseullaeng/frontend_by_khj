// 보호된 라우트 컴포넌트: 로그인이 필요한 페이지에 대한 접근 제어
import { Navigate, Outlet } from 'react-router-dom'  // React Router 컴포넌트들
import { useAuthStore } from '@/features/auth/store'   // 인증 상태 관리 스토어

/**
 * 보호된 라우트 컴포넌트
 * 로그인이 필요한 페이지들을 보호하는 라우트 가드입니다.
 * 
 * 동작 방식:
 * - 사용자가 로그인되어 있으면: 자식 라우트를 렌더링 (Outlet)
 * - 사용자가 로그인되어 있지 않으면: 로그인 페이지로 리다이렉트
 * 
 * 사용법:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/profile" element={<ProfilePage />} />
 *   <Route path="/settings" element={<SettingsPage />} />
 * </Route>
 */
export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)  // 현재 로그인된 사용자 정보
  
  // 사용자가 없으면 로그인 페이지로 리다이렉트 (replace로 뒤로가기 방지)
  if (!user) return <Navigate to="/login" replace />
  
  // 로그인된 사용자이면 자식 라우트 렌더링
  return <Outlet />
}
