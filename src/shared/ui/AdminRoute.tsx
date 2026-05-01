// 관리자 전용 라우트 컴포넌트: 관리자 권한이 필요한 페이지에 대한 접근 제어
import { Navigate, Outlet } from 'react-router-dom'  // React Router 컴포넌트들
import { useAuthStore } from '@/features/auth/store'   // 인증 상태 관리 스토어

/**
 * 관리자 전용 라우트 컴포넌트
 * 관리자 권한이 있는 사용자만 접근할 수 있는 페이지들을 보호하는 라우트 가드입니다.
 * 
 * 동작 방식:
 * - 사용자가 로그인되어 있지 않으면: 관리자 로그인 페이지로 리다이렉트
 * - 사용자가 로그인되어 있지만 관리자가 아니면: 403 권한 없음 페이지로 리다이렉트
 * - 관리자이면: 자식 라우트를 렌더링 (Outlet)
 * 
 * 주로 관리자 대시보드, 사용자 관리 등 관리자 기능 페이지에 사용됩니다.
 * 
 * 사용법:
 * <Route element={<AdminRoute />}>
 *   <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *   <Route path="/admin/users" element={<AdminUserPage />} />
 * </Route>
 */
export default function AdminRoute() {
  const user = useAuthStore((s) => s.user)  // 현재 로그인된 사용자 정보
  
  // 사용자가 없으면 관리자 로그인 페이지로 리다이렉트
  if (!user) return <Navigate to="/admin/login" replace />
  
  // 사용자가 있지만 관리자 권한이 없으면 403 페이지로 리다이렉트
  if (user.role !== 'ADMIN') return <Navigate to="/403" replace />
  
  // 관리자이면 자식 라우트 렌더링
  return <Outlet />
}
