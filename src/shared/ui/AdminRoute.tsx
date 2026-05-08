// 관리자 전용 라우트 가드.
//
// 백엔드 정책상 admin AT/RT 는 /users/me 를 못 부르고 /admin/me 를 사용한다.
// 일반 useAuthStore.user (USER 도메인) 가 비어있어도 admin 세션은 유효할 수 있으므로,
// admin 가드는 useAdminMe 의 응답으로만 판단한다.
import { Navigate, Outlet } from 'react-router-dom'
import { useAdminMe } from '@/features/admin/hooks'

export default function AdminRoute() {
  const { data, isLoading, isError } = useAdminMe()

  // 첫 진입 시 /admin/me 응답을 기다림 — 빈 화면 잠깐, 가드 false 판단으로 튕기지 않게.
  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-400">관리자 인증 확인 중...</div>
  }

  // 401/403/404 등 → 미인증 → 로그인 페이지
  if (isError || !data || data.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
