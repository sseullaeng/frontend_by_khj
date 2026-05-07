// 마이페이지: 일반 유저는 프로필·포인트·메뉴, 관리자는 통계 대시보드(lazy 로드)
import { Suspense, lazy } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useLogout } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/Button'
import { ChevronRight, Plus, Wallet } from 'lucide-react'

// 관리자 차트 대시보드 (recharts ~300KB) — 관리자 진입 시에만 로드
const AdminStats = lazy(() => import('./AdminStats'))

const MENU_ITEMS = [
  { label: '내 거래',     to: '/mypage/items' },
  { label: '찜 목록',     to: '/mypage/wishes' },
  { label: '리뷰 관리',   to: '/reviews' },
  { label: '포인트 내역', to: '/point' },
  { label: '차단 목록',   to: '/mypage/blocks' },
]

export default function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="flex flex-col gap-4">

      {isAdmin ? (
        <Suspense fallback={<p className="py-12 text-center text-sm text-gray-400">대시보드 불러오는 중...</p>}>
          <AdminStats nickname={user?.nickname ?? '관리자'} />
        </Suspense>
      ) : (
        <>
          {/* 일반 유저 프로필 */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user?.profileImage && (
                <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{user?.nickname}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <Link to="/mypage/edit" className="text-sm text-primary-500">수정</Link>
          </div>

          {/* 신뢰 지수 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600">신뢰 지수</span>
            <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
          </div>

          {/* 포인트 카드 — 잔액 + 충전 버튼 */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="opacity-90" />
              <span className="text-xs opacity-90">내 포인트</span>
            </div>
            <p className="text-2xl font-bold mb-4">
              {(user?.pointBalance ?? 0).toLocaleString()}원
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/point/charge')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors"
              >
                <Plus size={14} />
                충전
              </button>
              <button
                onClick={() => navigate('/point/withdraw')}
                className="flex-1 py-2.5 border border-white/40 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
              >
                출금
              </button>
            </div>
          </div>

          {/* 메뉴 */}
          <ul className="divide-y divide-gray-100">
            {MENU_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="flex items-center justify-between py-4 text-sm text-gray-700">
                  {item.label}
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>
    </div>
  )
}
