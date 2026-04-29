import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'

/** 로그인된 사용자가 /login, /signup 접근 시 홈으로 */
export default function PublicOnlyRoute() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
